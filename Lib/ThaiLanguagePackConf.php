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

namespace Modules\ModuleThaiLanguagePack\Lib;

use MikoPBX\Modules\Config\ConfigClass;
use Modules\ModuleThaiLanguagePack\Lib\RestAPI\Controllers\SoundsController;

/**
 * ThaiLanguagePackConf
 *
 * Wires the per-module REST endpoints (sounds inventory + conversion progress).
 */
class ThaiLanguagePackConf extends ConfigClass
{
    public const string ROUTE_PREFIX = '/pbxcore/api/v3/module-thai-language-pack';

    /**
     * Register module REST routes (Pattern 2: ConfigClass-based).
     *
     * @return array<int, array{0: class-string, 1: string, 2: string, 3: string, 4: string, 5: bool}>
     */
    public function getPBXCoreRESTAdditionalRoutes(): array
    {
        return [
            [SoundsController::class, 'listAction',     self::ROUTE_PREFIX . '/sounds',          'get', '/', false],
            [SoundsController::class, 'progressAction', self::ROUTE_PREFIX . '/sounds/progress', 'get', '/', false],
        ];
    }
}
