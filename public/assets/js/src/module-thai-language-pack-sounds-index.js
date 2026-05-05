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

/* global $, document, globalTranslate, IndexSoundPlayer, LanguagePackSoundsAPI, PbxDataTableIndex, SecurityUtils, window */

/**
 * lpSoundsIndex — Sound files page for the Language Pack module.
 *
 * Standard MikoPBX section module pattern (see docs/README-PbxDataTableIndex.md).
 * Server-side processing is enabled through `dataTableOptions` so only ~50 rows
 * are mounted at once even though the language pack ships ~600 wav files.
 *
 * The conversion progress widget lives in its own module (`lpSoundsProgress`,
 * also mounted on the overview page); this module just listens for the
 * `lp:sounds-progress:completed` event to refresh once when conversion ends.
 *
 * @module lpSoundsIndex
 */
const lpSoundsIndex = {
    dataTableInstance: null,

    initialize() {
        if ($('#languagepack-sounds-table').length === 0) {
            return;
        }

        lpSoundsIndex.dataTableInstance = new PbxDataTableIndex({
            tableId: 'languagepack-sounds-table',
            apiModule: LanguagePackSoundsAPI,
            routePrefix: 'module-thai-language-pack/module-thai-language-pack',
            actionButtons: [],
            customActionButtons: [],
            enableSearchIndex: false,
            order: [[0, 'asc']],
            columns: [
                {
                    data: 'name',
                    orderable: true,
                    render: (data, type, row) => {
                        if (type !== 'display') return data;
                        const name = SecurityUtils.escapeHtml(data);
                        const phrase = row.phrase ? SecurityUtils.escapeHtml(row.phrase) : '';
                        const phraseHtml = phrase
                            ? `<div class="lp-phrase" style="color:#666;font-size:.9em;font-style:italic;margin-top:2px;">${phrase}</div>`
                            : '';
                        return `<i class="file audio outline icon"></i><strong>${name}</strong>${phraseHtml}`;
                    },
                },
                {
                    data: null,
                    orderable: false,
                    searchable: false,
                    className: 'cdr-player',
                    render: (data, type, row) => {
                        if (type !== 'display') return '';
                        // No browser-playable variant on disk yet (no .webm
                        // and no .wav alongside the source). Show a muted
                        // placeholder; the row stays available for download.
                        if (!row.playable || !row.playUrl) {
                            return '<span style="color:#999;">—</span>';
                        }
                        const id = SecurityUtils.escapeHtml(row.id);
                        const url = SecurityUtils.escapeHtml(row.playUrl);
                        return `<table><tr>
                            <td class="one wide">
                                <button type="button" class="ui icon basic compact button play-button"><i class="play icon"></i></button>
                                <audio preload="none" id="audio-player-${id}" data-src="${url}"></audio>
                            </td>
                            <td><div class="ui range cdr-player"></div></td>
                            <td class="one wide"><span class="cdr-duration">--:--</span></td>
                        </tr></table>`;
                    },
                },
                {
                    data: 'converted',
                    orderable: true,
                    searchable: false,
                    className: 'center aligned collapsing',
                    render: (data, type) => {
                        if (type !== 'display') return data ? 1 : 0;
                        return data
                            ? '<i class="green check icon"></i>'
                            : '<i class="grey hourglass half icon"></i>';
                    },
                },
                {
                    data: null,
                    orderable: false,
                    searchable: false,
                    className: 'right aligned collapsing',
                    isActionColumn: true, // suppresses base class auto-injected action column
                    render: (data, type, row) => {
                        if (type !== 'display') return '';
                        const url = SecurityUtils.escapeHtml(row.downloadUrl);
                        return `<button type="button" class="ui icon basic compact button download-button" data-value="${url}"><i class="download icon"></i></button>`;
                    },
                },
            ],
            // Server-side overrides on top of the base config (spread last).
            dataTableOptions: {
                serverSide: true,
                processing: true,
                paging: true,
                lengthChange: true,
                pageLength: 50,
                lengthMenu: [[25, 50, 100, 200], [25, 50, 100, 200]],
                searchDelay: 400,
                rowId: 'id',
                createdRow(row) {
                    $(row).addClass('file-row');
                },
                ajax(data, callback) {
                    LanguagePackSoundsAPI.getList(data, (response) => {
                        // Drive container/loader visibility ourselves: when
                        // `ajax` is overridden via dataTableOptions, the base
                        // class's heuristic for locating our container fires
                        // before DataTables wraps the table and gets confused.
                        const tableContainerId = 'languagepack-sounds-table-container';

                        if (!response || response.result === false) {
                            $('#table-data-loader').hide();
                            $(`#${tableContainerId}`).hide();
                            $('#empty-table-placeholder').show();
                            callback({
                                draw: data.draw,
                                recordsTotal: 0,
                                recordsFiltered: 0,
                                data: [],
                            });
                            return;
                        }

                        const recordsTotal = response.recordsTotal || 0;
                        const recordsFiltered = response.recordsFiltered || 0;

                        $('#table-data-loader').hide();
                        if (recordsTotal === 0) {
                            $(`#${tableContainerId}`).hide();
                            $('#empty-table-placeholder').show();
                        } else {
                            $('#empty-table-placeholder').hide();
                            $(`#${tableContainerId}`).show();
                        }

                        callback({
                            draw: response.draw || data.draw,
                            recordsTotal,
                            recordsFiltered,
                            data: response.data || [],
                        });
                    });
                },
            },
            onDrawCallback: () => {
                $('#languagepack-sounds-table').find('tr.file-row').each((_, tr) => {
                    // Skip rows that don't have a playable variant — their
                    // cell renders a "—" placeholder instead of audio markup,
                    // and IndexSoundPlayer would throw without an <audio>.
                    if (!tr.id || typeof IndexSoundPlayer === 'undefined') return;
                    if (!document.getElementById(`audio-player-${tr.id}`)) return;
                    // eslint-disable-next-line no-new
                    new IndexSoundPlayer(tr.id);
                });
            },
        });

        lpSoundsIndex.dataTableInstance.initialize();
    },
};

$(document).ready(() => {
    lpSoundsIndex.initialize();
});
