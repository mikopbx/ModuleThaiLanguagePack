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

namespace Modules\ModuleThaiLanguagePack\Setup;

use MikoPBX\Core\System\SystemMessages;
use MikoPBX\Modules\PbxExtensionUtils;
use MikoPBX\Modules\Setup\PbxExtensionSetupBase;

/**
 * PbxExtensionSetup
 *
 * Setup class for Thai Language Pack Module
 *
 * This Language Pack module provides automatic installation of:
 * - Thai UI translations from Messages/th/ directory
 * - Thai voice prompts from Sounds/th-th/ directory
 *
 * The base class handles all installation/uninstallation automatically:
 * - Sound files are installed via SoundFilesConf::installModuleSounds()
 * - Translations are loaded via MessagesProvider::loadModuleTranslations()
 * - No additional logic is required for Language Pack modules
 *
 * @package Modules\ModuleThaiLanguagePack\Setup
 */
class PbxExtensionSetup extends PbxExtensionSetupBase
{
    /**
     * Module unique identifier
     */
    protected string $moduleUniqueID = 'ModuleThaiLanguagePack';

    /**
     * Additional actions before module installation
     *
     * For Language Pack modules, we check for conflicts with other Thai packs.
     * Only one Language Pack per language is allowed.
     *
     * @return bool True if installation can proceed
     */
    public function onBeforeModuleEnable(): bool
    {
        // Check for Language Pack conflicts
        $conflictModule = PbxExtensionUtils::checkLanguagePackConflict(
            $this->moduleUniqueID,
            'th-th'
        );

        if ($conflictModule !== null) {
            $this->messages[] = "Cannot install: Another Thai Language Pack ($conflictModule) is already installed. Please uninstall it first.";
            return false;
        }

        return parent::onBeforeModuleEnable();
    }

    /**
     * Additional actions after module installation
     *
     * @return bool True if successful
     */
    public function onAfterModuleEnable(): bool
    {
        SystemMessages::sysLogMsg(
            __CLASS__,
            'Thai Language Pack installed successfully',
            LOG_INFO
        );

        return parent::onAfterModuleEnable();
    }

    /**
     * Additional actions before module uninstallation
     *
     * @return bool True if uninstallation can proceed
     */
    public function onBeforeModuleDisable(): bool
    {
        SystemMessages::sysLogMsg(
            __CLASS__,
            'Uninstalling Thai Language Pack',
            LOG_INFO
        );

        return parent::onBeforeModuleDisable();
    }

    /**
     * Additional actions after module uninstallation
     *
     * @return bool True if successful
     */
    public function onAfterModuleDisable(): bool
    {
        SystemMessages::sysLogMsg(
            __CLASS__,
            'Thai Language Pack uninstalled successfully',
            LOG_INFO
        );

        return parent::onAfterModuleDisable();
    }
}
