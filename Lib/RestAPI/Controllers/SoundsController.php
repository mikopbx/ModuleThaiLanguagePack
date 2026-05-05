<?php

declare(strict_types=1);

/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2026 Alexey Portnov and Nikolay Beketov
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.
 * If not, see <https://www.gnu.org/licenses/>.
 */

namespace Modules\ModuleThaiLanguagePack\Lib\RestAPI\Controllers;

use MikoPBX\Core\System\Configs\SoundFilesConf;
use MikoPBX\Core\System\Directories;
use MikoPBX\Core\System\Processes;
use MikoPBX\Core\Workers\WorkerSoundFilesInit;
use MikoPBX\Modules\PbxExtensionUtils;
use MikoPBX\PBXCoreREST\Controllers\Modules\ModulesControllerBase;
use Phalcon\Di\Di;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Redis;
use Throwable;

/**
 * SoundsController
 *
 * Provides per-module REST endpoints for the Sound files admin tab:
 *   GET /pbxcore/api/v3/module-thai-language-pack/sounds
 *   GET /pbxcore/api/v3/module-thai-language-pack/sounds/progress
 */
class SoundsController extends ModulesControllerBase
{
    private const string MODULE_UNIQUE_ID = 'ModuleThaiLanguagePack';

    /**
     * Returns the inventory of every .wav file shipped by this language pack
     * (recursive walk of the runtime sounds dir for the pack's language).
     */
    public function listAction(): void
    {
        if (!$this->ensureLanguagePackModule()) {
            return;
        }

        $languageCode = PbxExtensionUtils::getLanguagePackCode(self::MODULE_UNIQUE_ID);
        if ($languageCode === null) {
            $this->response->setPayloadError('Language code not found in module.json', 422);
            $this->response->send();
            return;
        }

        // DataTables server-side parameters (flat keys via PHP's $_GET).
        $draw   = (int) ($_GET['draw']   ?? 0);
        $start  = max(0, (int) ($_GET['start'] ?? 0));
        $length = (int) ($_GET['length'] ?? 50);
        if ($length < 0) {
            $length = PHP_INT_MAX; // -1 means "all" in DataTables
        }
        $search = trim((string) ($_GET['search']['value'] ?? ''));
        $orderColumn = (int) ($_GET['order'][0]['column'] ?? 0);
        $orderDir    = (($_GET['order'][0]['dir'] ?? 'asc') === 'desc') ? 'desc' : 'asc';

        // Build the base dir under AST_VAR_LIB_DIR/sounds (= /offload/asterisk/sounds),
        // which is what PlaybackAction's path whitelist accepts. AST_SOUNDS_DIR points
        // at the real storage location, but /offload/asterisk/sounds is a symlink to it,
        // so the iterator walks the same tree while the absolute paths emitted to the
        // client pass `strpos($path, $whitelistedDir) === 0`.
        $baseDir = Directories::getDir(Directories::AST_VAR_LIB_DIR) . '/sounds/' . $languageCode;
        $phraseMap = self::loadPhraseMap($languageCode);
        $rows = [];
        $convertedCount = 0;

        // Source/shipped audio formats. WebM is excluded — it's a derived
        // browser-preview format produced by WorkerSoundFilesInit, never an
        // input shipped by the module.
        $sourceExtensions = ['wav', 'gsm', 'mp3', 'ulaw', 'alaw', 'g722', 'sln', 'opus'];
        // Browser-playable formats in priority order (preferred for the inline
        // player). webm/Opus is far smaller and lighter than .wav, so we pick
        // it whenever WorkerSoundFilesInit has produced one alongside the
        // source. .wav remains a legacy fallback (some packs ship .wav as the
        // source — TTS-generated language packs in particular).
        $playableExtensions = ['webm', 'wav'];

        if (is_dir($baseDir)) {
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($baseDir, RecursiveDirectoryIterator::SKIP_DOTS)
            );
            $baseDirLen = strlen($baseDir) + 1;
            // Group files by basename-without-extension so the listing has one
            // logical row per sound, even though WorkerSoundFilesInit produces
            // 7+ codec variants per file on disk.
            $bySoundKey = [];
            foreach ($iterator as $file) {
                if (!$file->isFile()) {
                    continue;
                }
                $ext = strtolower($file->getExtension());
                if (!in_array($ext, $sourceExtensions, true)) {
                    continue;
                }
                $absolutePath = $file->getPathname();
                $relativePath = substr($absolutePath, $baseDirLen);
                $relNoExt = preg_replace('/\.[^.]+$/', '', $relativePath);
                // Prefer a .wav source row over a .gsm one when both exist for
                // the same logical sound: .wav rows are easier to read and the
                // legacy fallback for the player anyway. Otherwise keep first
                // hit (alphabetical by extension, deterministic).
                $existing = $bySoundKey[$relNoExt] ?? null;
                if ($existing !== null && $ext !== 'wav') {
                    continue;
                }
                $bySoundKey[$relNoExt] = [
                    'absolutePath' => $absolutePath,
                    'relativePath' => $relativePath,
                    'relNoExt'     => $relNoExt,
                    'sizeBytes'    => $file->getSize(),
                    'sourceDir'    => $file->getPath(),
                    'baseName'     => pathinfo($absolutePath, PATHINFO_FILENAME),
                ];
            }

            foreach ($bySoundKey as $entry) {
                $absolutePath = $entry['absolutePath'];
                $relativePath = $entry['relativePath'];
                $sourceDir = $entry['sourceDir'];
                $baseName = $entry['baseName'];

                $metaFile = $sourceDir . '/.' . $baseName . '.sound-meta';
                $converted = is_file($metaFile);
                if ($converted) {
                    $convertedCount++;
                }

                // Pick the best browser-playable file for this sound:
                // webm > wav > nothing. Source itself is fine if it's already
                // playable. If neither exists, the JS hides the play button.
                $playablePath = null;
                foreach ($playableExtensions as $playExt) {
                    $candidate = $sourceDir . '/' . $baseName . '.' . $playExt;
                    if (is_file($candidate)) {
                        $playablePath = $candidate;
                        break;
                    }
                }
                $playUrl = $playablePath !== null
                    ? '/pbxcore/api/v3/sound-files:playback?view=' . rawurlencode($playablePath)
                    : null;
                $downloadUrl = '/pbxcore/api/v3/sound-files:playback?view='
                    . rawurlencode($absolutePath)
                    . '&download=1&filename=' . rawurlencode(basename($absolutePath));

                $rows[] = [
                    'id'          => 'lp-' . sha1($absolutePath),
                    'name'        => $relativePath,
                    'phrase'      => $phraseMap[$entry['relNoExt']] ?? '',
                    'category'    => str_contains($relativePath, '/') ? dirname($relativePath) : 'root',
                    'sizeBytes'   => $entry['sizeBytes'],
                    'playUrl'     => $playUrl,
                    'playable'    => $playUrl !== null,
                    'downloadUrl' => $downloadUrl,
                    'converted'   => $converted,
                ];
            }
        }

        $recordsTotal = count($rows);

        if ($search !== '') {
            $needle = mb_strtolower($search);
            $rows = array_values(array_filter(
                $rows,
                static fn(array $r): bool =>
                    str_contains(mb_strtolower($r['name']), $needle)
                    || ($r['phrase'] !== '' && str_contains(mb_strtolower($r['phrase']), $needle))
            ));
        }
        $recordsFiltered = count($rows);

        // Sort: column 0 = name (string), column 2 = converted (bool). Other columns are not orderable.
        $sortField = $orderColumn === 2 ? 'converted' : 'name';
        usort($rows, static function (array $a, array $b) use ($sortField, $orderDir): int {
            $cmp = $sortField === 'converted'
                ? ((int) $a['converted']) <=> ((int) $b['converted'])
                : strcmp($a['name'], $b['name']);
            return $orderDir === 'desc' ? -$cmp : $cmp;
        });

        $page = $length === PHP_INT_MAX ? $rows : array_slice($rows, $start, $length);

        $this->response->setPayloadSuccess([
            'result'          => true,
            'draw'            => $draw,
            'recordsTotal'    => $recordsTotal,
            'recordsFiltered' => $recordsFiltered,
            'data'            => $page,
            'convertedCount'  => $convertedCount,
            'languageCode'    => $languageCode,
        ]);
        $this->response->send();
    }

    /**
     * Returns conversion progress snapshot for this language pack.
     */
    public function progressAction(): void
    {
        if (!$this->ensureLanguagePackModule()) {
            return;
        }

        $languageCode = PbxExtensionUtils::getLanguagePackCode(self::MODULE_UNIQUE_ID);
        if ($languageCode === null) {
            $this->response->setPayloadError('Language code not found in module.json', 422);
            $this->response->send();
            return;
        }

        // Build the base dir under AST_VAR_LIB_DIR/sounds (= /offload/asterisk/sounds),
        // which is what PlaybackAction's path whitelist accepts. AST_SOUNDS_DIR points
        // at the real storage location, but /offload/asterisk/sounds is a symlink to it,
        // so the iterator walks the same tree while the absolute paths emitted to the
        // client pass `strpos($path, $whitelistedDir) === 0`.
        $baseDir = Directories::getDir(Directories::AST_VAR_LIB_DIR) . '/sounds/' . $languageCode;
        $total = 0;
        $converted = 0;

        // Mirror listAction's source-format set so progress is meaningful for
        // packs that ship .gsm/.mp3/.opus rather than .wav.
        $sourceExtensions = ['wav', 'gsm', 'mp3', 'ulaw', 'alaw', 'g722', 'sln', 'opus'];
        $seenBasenames = [];

        if (is_dir($baseDir)) {
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($baseDir, RecursiveDirectoryIterator::SKIP_DOTS)
            );
            $baseDirLen = strlen($baseDir) + 1;
            foreach ($iterator as $file) {
                if (!$file->isFile()) {
                    continue;
                }
                $ext = strtolower($file->getExtension());
                if (!in_array($ext, $sourceExtensions, true)) {
                    continue;
                }
                $relNoExt = preg_replace(
                    '/\.[^.]+$/',
                    '',
                    substr($file->getPathname(), $baseDirLen)
                );
                if (isset($seenBasenames[$relNoExt])) {
                    continue;
                }
                $seenBasenames[$relNoExt] = true;
                $total++;
                $baseName = pathinfo($file->getPathname(), PATHINFO_FILENAME);
                $metaFile = $file->getPath() . '/.' . $baseName . '.sound-meta';
                if (is_file($metaFile)) {
                    $converted++;
                }
            }
        }

        $systemDone = false;
        $moduleDone = false;
        try {
            $di = Di::getDefault();
            if ($di !== null) {
                /** @var Redis $redis */
                $redis = $di->getShared('redis');
                $systemDone = (bool) $redis->exists(SoundFilesConf::REDIS_SYSTEM_SOUNDS_KEY);
                $moduleDone = (bool) $redis->exists(SoundFilesConf::REDIS_MODULE_SOUNDS_PREFIX . self::MODULE_UNIQUE_ID);
            }
        } catch (Throwable) {
            // Redis unreachable — treat markers as missing; UI will report "queued".
        }

        $running = self::isWorkerRunning();
        $percent = $total > 0 ? (int) round(($converted / $total) * 100) : 0;

        if ($moduleDone) {
            $stage = 'completed';
        } elseif ($running) {
            $stage = 'converting';
        } else {
            $stage = 'queued';
        }

        $this->response->setPayloadSuccess([
            'result' => true,
            'data'   => [
                'total'      => $total,
                'converted'  => $converted,
                'percent'    => $percent,
                'systemDone' => $systemDone,
                'moduleDone' => $moduleDone,
                'running'    => $running,
                'stage'      => $stage,
            ],
        ]);
        $this->response->send();
    }

    /**
     * Guard: only Language Pack modules may use these endpoints.
     */
    private function ensureLanguagePackModule(): bool
    {
        if (!PbxExtensionUtils::isLanguagePackModule(self::MODULE_UNIQUE_ID)) {
            $this->response->setPayloadError('Not a language pack module', 400);
            $this->response->send();
            return false;
        }
        return true;
    }

    /**
     * Build the source-phrase mapping for the module's UI.
     *
     * Search order, with later entries overriding earlier ones so the most
     * specific text wins:
     *   1. `<sounds>/en-en/core-sounds-en.txt` — Asterisk-canonical English
     *      text shipped with every Asterisk install. Acts as graceful
     *      fallback when the language pack ships an incomplete or skeleton
     *      mapping file (e.g. several official packs ship `key:` lines with
     *      no translation yet).
     *   2. `<sounds>/<lang>/core-sounds-*.txt` — system-installed native
     *      mapping after the module's sounds were installed.
     *   3. `<moduleDir>/Sounds/core-sounds-<lang>.txt` — module-specific
     *      mapping at the conventional location used by TTS-generated packs.
     *   4. `<moduleDir>/Sounds/<lang>/core-sounds-*.txt` — module-specific
     *      mapping in the language subdirectory used by older Asterisk-shipped
     *      packs (filename suffix varies: `nl`, `de_DE`, etc.).
     *
     * Each file uses `relative/path-without-ext: Phrase text` per line; lines
     * starting with `;` are ignored.
     *
     * @return array<string, string>
     */
    private static function loadPhraseMap(string $languageCode): array
    {
        $moduleDir = PbxExtensionUtils::getModuleDir(self::MODULE_UNIQUE_ID);
        $systemSoundsDir = Directories::getDir(Directories::AST_VAR_LIB_DIR) . '/sounds';

        $candidatePaths = [
            // 1. English fallback — always present on a configured PBX.
            $systemSoundsDir . '/en-en/core-sounds-en.txt',
        ];
        // 2. System-installed native mapping (any *.txt file in the lang dir).
        $sysGlob = glob($systemSoundsDir . '/' . $languageCode . '/core-sounds-*.txt') ?: [];
        foreach ($sysGlob as $p) {
            $candidatePaths[] = $p;
        }
        // 3. Module-shipped conventional mapping.
        $candidatePaths[] = $moduleDir . '/Sounds/core-sounds-' . $languageCode . '.txt';
        // 4. Module-shipped native mapping inside lang subdir.
        $modGlob = glob($moduleDir . '/Sounds/' . $languageCode . '/core-sounds-*.txt') ?: [];
        foreach ($modGlob as $p) {
            $candidatePaths[] = $p;
        }

        $map = [];
        foreach ($candidatePaths as $mapFile) {
            if (!is_file($mapFile)) {
                continue;
            }
            $handle = @fopen($mapFile, 'rb');
            if ($handle === false) {
                continue;
            }
            while (($line = fgets($handle)) !== false) {
                $line = rtrim($line, "\r\n");
                if ($line === '' || $line[0] === ';') {
                    continue;
                }
                $colon = strpos($line, ':');
                if ($colon === false) {
                    continue;
                }
                $key = trim(substr($line, 0, $colon));
                $value = trim(substr($line, $colon + 1));
                if ($key !== '' && $value !== '') {
                    $map[$key] = $value; // later sources override earlier ones
                }
            }
            fclose($handle);
        }
        return $map;
    }

    /**
     * Detect if WorkerSoundFilesInit is currently running via its PID file.
     */
    private static function isWorkerRunning(): bool
    {
        $pidFile = Processes::getPidFilePath(WorkerSoundFilesInit::class);
        if (!file_exists($pidFile)) {
            return false;
        }
        $pid = (int) trim((string) @file_get_contents($pidFile));
        if ($pid <= 0) {
            return false;
        }
        return Processes::isProcessRunning((string) $pid);
    }
}
