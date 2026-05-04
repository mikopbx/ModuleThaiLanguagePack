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

/* global PbxApiClient */

/**
 * LanguagePackSoundsAPI — REST API v3 client for the language-pack sound files
 * inventory and conversion progress.
 *
 * Mirrors the Core convention (see `js/src/PbxAPI/sound-files-api.js`):
 * a `PbxApiClient` instance with `customMethods` for the two endpoints,
 * exposing `getList(params, callback)` and `getProgressSnapshot(callback)`
 * to the UI layer.
 *
 * @class LanguagePackSoundsAPI
 */
const LanguagePackSoundsAPI = new PbxApiClient({
    endpoint: '/pbxcore/api/v3/module-thai-language-pack',
    customMethods: {
        getList: '/sounds',
        getProgress: '/sounds/progress',
    },
});

Object.assign(LanguagePackSoundsAPI, {
    /**
     * Get list of sound files for the DataTable.
     * Accepts standard DataTables server-side params (start, length, search[value], order[0][...]).
     *
     * @param {object} params Query parameters from DataTable
     * @param {function} callback Callback receiving raw response
     */
    getList(params, callback) {
        return this.callCustomMethod('getList', params || {}, callback);
    },

    /**
     * Poll conversion progress for this language pack.
     *
     * @param {function} callback Callback receiving the progress payload
     */
    getProgressSnapshot(callback) {
        return this.callCustomMethod('getProgress', {}, callback);
    },
});
