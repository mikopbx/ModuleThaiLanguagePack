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

/* global $, document, globalTranslate, LanguagePackSoundsAPI, PbxApiClient, SecurityUtils, window */

/**
 * lpSoundsProgress — sound files conversion progress widget.
 *
 * Used on both the module overview page and the dedicated Sound files page.
 * Polls /sounds/progress every 2s, renders into `#languagepack-sounds-progress`,
 * and emits a `lp:sounds-progress:completed` window event on stage transition
 * to "completed" so the (optionally present) DataTable can refresh once.
 *
 * @module lpSoundsProgress
 */
const lpSoundsProgress = {
    $progress: null,
    pollHandle: null,
    pollIntervalMs: 2000,
    stopped: false,
    lastStage: null,

    initialize() {
        lpSoundsProgress.$progress = $('#languagepack-sounds-progress');
        if (lpSoundsProgress.$progress.length === 0
            || typeof LanguagePackSoundsAPI === 'undefined') {
            return;
        }
        lpSoundsProgress.tick();
        lpSoundsProgress.pollHandle = setInterval(lpSoundsProgress.tick, lpSoundsProgress.pollIntervalMs);
        $(window).on('beforeunload pagehide', lpSoundsProgress.stop);
    },

    stop() {
        lpSoundsProgress.stopped = true;
        if (lpSoundsProgress.pollHandle !== null) {
            clearInterval(lpSoundsProgress.pollHandle);
            lpSoundsProgress.pollHandle = null;
        }
    },

    tick() {
        if (lpSoundsProgress.stopped) return;
        LanguagePackSoundsAPI.getProgressSnapshot((response) => {
            if (!response) return;
            if (response.result === false) {
                if (typeof PbxApiClient !== 'undefined' && PbxApiClient.handleAuthError) {
                    PbxApiClient.handleAuthError(response.httpCode || 0);
                }
                return;
            }
            const data = response.data || null;
            if (!data) return;
            lpSoundsProgress.render(data);
            const prev = lpSoundsProgress.lastStage;
            lpSoundsProgress.lastStage = data.stage;
            if (data.stage === 'completed') {
                lpSoundsProgress.stop();
                if (prev !== null && prev !== 'completed') {
                    $(window).trigger('lp:sounds-progress:completed');
                }
            }
        });
    },

    escape(value) {
        if (typeof SecurityUtils !== 'undefined' && SecurityUtils.escapeHtml) {
            return SecurityUtils.escapeHtml(value);
        }
        return String(value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    render(data) {
        const stageKey = `mlp_th_Stage${data.stage.charAt(0).toUpperCase()}${data.stage.slice(1)}`;
        const stageLabel = (typeof globalTranslate !== 'undefined' && globalTranslate[stageKey])
            ? globalTranslate[stageKey]
            : data.stage;
        const title = (typeof globalTranslate !== 'undefined' && globalTranslate.mlp_th_ProgressTitle)
            ? globalTranslate.mlp_th_ProgressTitle
            : 'Sound files conversion';
        const stageColor = data.stage === 'completed'
            ? 'green'
            : (data.running ? 'blue active' : 'grey');
        const pct = Number.isFinite(data.percent) ? data.percent : 0;
        const warningHtml = data.stage !== 'completed'
            ? `<div class="ui small warning message" style="margin-top: 0.7em;">
                   <i class="hourglass half icon"></i>
                   ${(typeof globalTranslate !== 'undefined' && globalTranslate.mlp_th_WaitBeforeSwitching) || 'Wait until conversion finishes before switching language in General Settings.'}
               </div>`
            : '';
        lpSoundsProgress.$progress.html(`
            <h4 class="ui header" style="margin-bottom: 0.5em;">
                <i class="music icon"></i>${lpSoundsProgress.escape(title)}
            </h4>
            <div class="ui ${stageColor} progress" data-percent="${pct}">
                <div class="bar" style="width:${pct}%;"><div class="progress">${pct}%</div></div>
                <div class="label">${lpSoundsProgress.escape(stageLabel)} — ${data.converted} / ${data.total}</div>
            </div>
            ${warningHtml}
        `);
    },
};

$(document).ready(() => {
    lpSoundsProgress.initialize();
});
