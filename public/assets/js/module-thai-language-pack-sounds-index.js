"use strict";

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
var lpSoundsIndex = {
  dataTableInstance: null,
  initialize: function initialize() {
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
      columns: [{
        data: 'name',
        orderable: true,
        render: function render(data, type, row) {
          if (type !== 'display') return data;
          var name = SecurityUtils.escapeHtml(data);
          var phrase = row.phrase ? SecurityUtils.escapeHtml(row.phrase) : '';
          var phraseHtml = phrase ? "<div class=\"lp-phrase\" style=\"color:#666;font-size:.9em;font-style:italic;margin-top:2px;\">".concat(phrase, "</div>") : '';
          return "<i class=\"file audio outline icon\"></i><strong>".concat(name, "</strong>").concat(phraseHtml);
        }
      }, {
        data: null,
        orderable: false,
        searchable: false,
        className: 'cdr-player',
        render: function render(data, type, row) {
          if (type !== 'display') return ''; // No browser-playable variant on disk yet (no .webm
          // and no .wav alongside the source). Show a muted
          // placeholder; the row stays available for download.

          if (!row.playable || !row.playUrl) {
            return '<span style="color:#999;">—</span>';
          }

          var id = SecurityUtils.escapeHtml(row.id);
          var url = SecurityUtils.escapeHtml(row.playUrl);
          return "<table><tr>\n                            <td class=\"one wide\">\n                                <button type=\"button\" class=\"ui icon basic compact button play-button\"><i class=\"play icon\"></i></button>\n                                <audio preload=\"none\" id=\"audio-player-".concat(id, "\" data-src=\"").concat(url, "\"></audio>\n                            </td>\n                            <td><div class=\"ui range cdr-player\"></div></td>\n                            <td class=\"one wide\"><span class=\"cdr-duration\">--:--</span></td>\n                        </tr></table>");
        }
      }, {
        data: 'converted',
        orderable: true,
        searchable: false,
        className: 'center aligned collapsing',
        render: function render(data, type) {
          if (type !== 'display') return data ? 1 : 0;
          return data ? '<i class="green check icon"></i>' : '<i class="grey hourglass half icon"></i>';
        }
      }, {
        data: null,
        orderable: false,
        searchable: false,
        className: 'right aligned collapsing',
        isActionColumn: true,
        // suppresses base class auto-injected action column
        render: function render(data, type, row) {
          if (type !== 'display') return '';
          var url = SecurityUtils.escapeHtml(row.downloadUrl);
          return "<button type=\"button\" class=\"ui icon basic compact button download-button\" data-value=\"".concat(url, "\"><i class=\"download icon\"></i></button>");
        }
      }],
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
        createdRow: function createdRow(row) {
          $(row).addClass('file-row');
        },
        ajax: function ajax(data, callback) {
          LanguagePackSoundsAPI.getList(data, function (response) {
            // Drive container/loader visibility ourselves: when
            // `ajax` is overridden via dataTableOptions, the base
            // class's heuristic for locating our container fires
            // before DataTables wraps the table and gets confused.
            var tableContainerId = 'languagepack-sounds-table-container';

            if (!response || response.result === false) {
              $('#table-data-loader').hide();
              $("#".concat(tableContainerId)).hide();
              $('#empty-table-placeholder').show();
              callback({
                draw: data.draw,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: []
              });
              return;
            }

            var recordsTotal = response.recordsTotal || 0;
            var recordsFiltered = response.recordsFiltered || 0;
            $('#table-data-loader').hide();

            if (recordsTotal === 0) {
              $("#".concat(tableContainerId)).hide();
              $('#empty-table-placeholder').show();
            } else {
              $('#empty-table-placeholder').hide();
              $("#".concat(tableContainerId)).show();
            }

            callback({
              draw: response.draw || data.draw,
              recordsTotal: recordsTotal,
              recordsFiltered: recordsFiltered,
              data: response.data || []
            });
          });
        }
      },
      onDrawCallback: function onDrawCallback() {
        $('#languagepack-sounds-table').find('tr.file-row').each(function (_, tr) {
          // Skip rows that don't have a playable variant — their
          // cell renders a "—" placeholder instead of audio markup,
          // and IndexSoundPlayer would throw without an <audio>.
          if (!tr.id || typeof IndexSoundPlayer === 'undefined') return;
          if (!document.getElementById("audio-player-".concat(tr.id))) return; // eslint-disable-next-line no-new

          new IndexSoundPlayer(tr.id);
        });
      }
    });
    lpSoundsIndex.dataTableInstance.initialize();
  }
};
$(document).ready(function () {
  lpSoundsIndex.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdWtyYWluaWFuLWxhbmd1YWdlLXBhY2stc291bmRzLWluZGV4LmpzIl0sIm5hbWVzIjpbImxwU291bmRzSW5kZXgiLCJkYXRhVGFibGVJbnN0YW5jZSIsImluaXRpYWxpemUiLCIkIiwibGVuZ3RoIiwiUGJ4RGF0YVRhYmxlSW5kZXgiLCJ0YWJsZUlkIiwiYXBpTW9kdWxlIiwiTGFuZ3VhZ2VQYWNrU291bmRzQVBJIiwicm91dGVQcmVmaXgiLCJhY3Rpb25CdXR0b25zIiwiY3VzdG9tQWN0aW9uQnV0dG9ucyIsImVuYWJsZVNlYXJjaEluZGV4Iiwib3JkZXIiLCJjb2x1bW5zIiwiZGF0YSIsIm9yZGVyYWJsZSIsInJlbmRlciIsInR5cGUiLCJyb3ciLCJuYW1lIiwiU2VjdXJpdHlVdGlscyIsImVzY2FwZUh0bWwiLCJwaHJhc2UiLCJwaHJhc2VIdG1sIiwic2VhcmNoYWJsZSIsImNsYXNzTmFtZSIsInBsYXlhYmxlIiwicGxheVVybCIsImlkIiwidXJsIiwiaXNBY3Rpb25Db2x1bW4iLCJkb3dubG9hZFVybCIsImRhdGFUYWJsZU9wdGlvbnMiLCJzZXJ2ZXJTaWRlIiwicHJvY2Vzc2luZyIsInBhZ2luZyIsImxlbmd0aENoYW5nZSIsInBhZ2VMZW5ndGgiLCJsZW5ndGhNZW51Iiwic2VhcmNoRGVsYXkiLCJyb3dJZCIsImNyZWF0ZWRSb3ciLCJhZGRDbGFzcyIsImFqYXgiLCJjYWxsYmFjayIsImdldExpc3QiLCJyZXNwb25zZSIsInRhYmxlQ29udGFpbmVySWQiLCJyZXN1bHQiLCJoaWRlIiwic2hvdyIsImRyYXciLCJyZWNvcmRzVG90YWwiLCJyZWNvcmRzRmlsdGVyZWQiLCJvbkRyYXdDYWxsYmFjayIsImZpbmQiLCJlYWNoIiwiXyIsInRyIiwiSW5kZXhTb3VuZFBsYXllciIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJyZWFkeSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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LENBQUM7QUFDTE8sY0FBQUEsSUFBSSxFQUFFTCxRQUFRLENBQUNLLElBQVQsSUFBaUJyQyxJQUFJLENBQUNxQyxJQUR2QjtBQUVMQyxjQUFBQSxZQUFZLEVBQVpBLFlBRks7QUFHTEMsY0FBQUEsZUFBZSxFQUFmQSxlQUhLO0FBSUx2QyxjQUFBQSxJQUFJLEVBQUVnQyxRQUFRLENBQUNoQyxJQUFULElBQWlCO0FBSmxCLGFBQUQsQ0FBUjtBQU1ILFdBdENEO0FBdUNIO0FBcERhLE9BekVrQztBQStIcER3QyxNQUFBQSxjQUFjLEVBQUUsMEJBQU07QUFDbEJwRCxRQUFBQSxDQUFDLENBQUMsNEJBQUQsQ0FBRCxDQUFnQ3FELElBQWhDLENBQXFDLGFBQXJDLEVBQW9EQyxJQUFwRCxDQUF5RCxVQUFDQyxDQUFELEVBQUlDLEVBQUosRUFBVztBQUNoRTtBQUNBO0FBQ0E7QUFDQSxjQUFJLENBQUNBLEVBQUUsQ0FBQzlCLEVBQUosSUFBVSxPQUFPK0IsZ0JBQVAsS0FBNEIsV0FBMUMsRUFBdUQ7QUFDdkQsY0FBSSxDQUFDQyxRQUFRLENBQUNDLGNBQVQsd0JBQXdDSCxFQUFFLENBQUM5QixFQUEzQyxFQUFMLEVBQXVELE9BTFMsQ0FNaEU7O0FBQ0EsY0FBSStCLGdCQUFKLENBQXFCRCxFQUFFLENBQUM5QixFQUF4QjtBQUNILFNBUkQ7QUFTSDtBQXpJbUQsS0FBdEIsQ0FBbEM7QUE0SUE3QixJQUFBQSxhQUFhLENBQUNDLGlCQUFkLENBQWdDQyxVQUFoQztBQUNIO0FBckppQixDQUF0QjtBQXdKQUMsQ0FBQyxDQUFDMEQsUUFBRCxDQUFELENBQVlFLEtBQVosQ0FBa0IsWUFBTTtBQUNwQi9ELEVBQUFBLGFBQWEsQ0FBQ0UsVUFBZDtBQUNILENBRkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogTWlrb1BCWCAtIGZyZWUgcGhvbmUgc3lzdGVtIGZvciBzbWFsbCBidXNpbmVzc1xuICogQ29weXJpZ2h0IMKpIDIwMTctMjAyNiBBbGV4ZXkgUG9ydG5vdiBhbmQgTmlrb2xheSBCZWtldG92XG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLlxuICogSWYgbm90LCBzZWUgPGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiBnbG9iYWwgJCwgZG9jdW1lbnQsIGdsb2JhbFRyYW5zbGF0ZSwgSW5kZXhTb3VuZFBsYXllciwgTGFuZ3VhZ2VQYWNrU291bmRzQVBJLCBQYnhEYXRhVGFibGVJbmRleCwgU2VjdXJpdHlVdGlscywgd2luZG93ICovXG5cbi8qKlxuICogbHBTb3VuZHNJbmRleCDigJQgU291bmQgZmlsZXMgcGFnZSBmb3IgdGhlIExhbmd1YWdlIFBhY2sgbW9kdWxlLlxuICpcbiAqIFN0YW5kYXJkIE1pa29QQlggc2VjdGlvbiBtb2R1bGUgcGF0dGVybiAoc2VlIGRvY3MvUkVBRE1FLVBieERhdGFUYWJsZUluZGV4Lm1kKS5cbiAqIFNlcnZlci1zaWRlIHByb2Nlc3NpbmcgaXMgZW5hYmxlZCB0aHJvdWdoIGBkYXRhVGFibGVPcHRpb25zYCBzbyBvbmx5IH41MCByb3dzXG4gKiBhcmUgbW91bnRlZCBhdCBvbmNlIGV2ZW4gdGhvdWdoIHRoZSBsYW5ndWFnZSBwYWNrIHNoaXBzIH42MDAgd2F2IGZpbGVzLlxuICpcbiAqIFRoZSBjb252ZXJzaW9uIHByb2dyZXNzIHdpZGdldCBsaXZlcyBpbiBpdHMgb3duIG1vZHVsZSAoYGxwU291bmRzUHJvZ3Jlc3NgLFxuICogYWxzbyBtb3VudGVkIG9uIHRoZSBvdmVydmlldyBwYWdlKTsgdGhpcyBtb2R1bGUganVzdCBsaXN0ZW5zIGZvciB0aGVcbiAqIGBscDpzb3VuZHMtcHJvZ3Jlc3M6Y29tcGxldGVkYCBldmVudCB0byByZWZyZXNoIG9uY2Ugd2hlbiBjb252ZXJzaW9uIGVuZHMuXG4gKlxuICogQG1vZHVsZSBscFNvdW5kc0luZGV4XG4gKi9cbmNvbnN0IGxwU291bmRzSW5kZXggPSB7XG4gICAgZGF0YVRhYmxlSW5zdGFuY2U6IG51bGwsXG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAoJCgnI2xhbmd1YWdlcGFjay1zb3VuZHMtdGFibGUnKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxwU291bmRzSW5kZXguZGF0YVRhYmxlSW5zdGFuY2UgPSBuZXcgUGJ4RGF0YVRhYmxlSW5kZXgoe1xuICAgICAgICAgICAgdGFibGVJZDogJ2xhbmd1YWdlcGFjay1zb3VuZHMtdGFibGUnLFxuICAgICAgICAgICAgYXBpTW9kdWxlOiBMYW5ndWFnZVBhY2tTb3VuZHNBUEksXG4gICAgICAgICAgICByb3V0ZVByZWZpeDogJ21vZHVsZS11a3JhaW5pYW4tbGFuZ3VhZ2UtcGFjay9tb2R1bGUtdWtyYWluaWFuLWxhbmd1YWdlLXBhY2snLFxuICAgICAgICAgICAgYWN0aW9uQnV0dG9uczogW10sXG4gICAgICAgICAgICBjdXN0b21BY3Rpb25CdXR0b25zOiBbXSxcbiAgICAgICAgICAgIGVuYWJsZVNlYXJjaEluZGV4OiBmYWxzZSxcbiAgICAgICAgICAgIG9yZGVyOiBbWzAsICdhc2MnXV0sXG4gICAgICAgICAgICBjb2x1bW5zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiAnbmFtZScsXG4gICAgICAgICAgICAgICAgICAgIG9yZGVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyOiAoZGF0YSwgdHlwZSwgcm93KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSAhPT0gJ2Rpc3BsYXknKSByZXR1cm4gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBTZWN1cml0eVV0aWxzLmVzY2FwZUh0bWwoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwaHJhc2UgPSByb3cucGhyYXNlID8gU2VjdXJpdHlVdGlscy5lc2NhcGVIdG1sKHJvdy5waHJhc2UpIDogJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwaHJhc2VIdG1sID0gcGhyYXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBgPGRpdiBjbGFzcz1cImxwLXBocmFzZVwiIHN0eWxlPVwiY29sb3I6IzY2Njtmb250LXNpemU6LjllbTtmb250LXN0eWxlOml0YWxpYzttYXJnaW4tdG9wOjJweDtcIj4ke3BocmFzZX08L2Rpdj5gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgPGkgY2xhc3M9XCJmaWxlIGF1ZGlvIG91dGxpbmUgaWNvblwiPjwvaT48c3Ryb25nPiR7bmFtZX08L3N0cm9uZz4ke3BocmFzZUh0bWx9YDtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoYWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogJ2Nkci1wbGF5ZXInLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXI6IChkYXRhLCB0eXBlLCByb3cpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlICE9PSAnZGlzcGxheScpIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vIGJyb3dzZXItcGxheWFibGUgdmFyaWFudCBvbiBkaXNrIHlldCAobm8gLndlYm1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFuZCBubyAud2F2IGFsb25nc2lkZSB0aGUgc291cmNlKS4gU2hvdyBhIG11dGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwbGFjZWhvbGRlcjsgdGhlIHJvdyBzdGF5cyBhdmFpbGFibGUgZm9yIGRvd25sb2FkLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyb3cucGxheWFibGUgfHwgIXJvdy5wbGF5VXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc8c3BhbiBzdHlsZT1cImNvbG9yOiM5OTk7XCI+4oCUPC9zcGFuPic7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpZCA9IFNlY3VyaXR5VXRpbHMuZXNjYXBlSHRtbChyb3cuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdXJsID0gU2VjdXJpdHlVdGlscy5lc2NhcGVIdG1sKHJvdy5wbGF5VXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgPHRhYmxlPjx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJvbmUgd2lkZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInVpIGljb24gYmFzaWMgY29tcGFjdCBidXR0b24gcGxheS1idXR0b25cIj48aSBjbGFzcz1cInBsYXkgaWNvblwiPjwvaT48L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGF1ZGlvIHByZWxvYWQ9XCJub25lXCIgaWQ9XCJhdWRpby1wbGF5ZXItJHtpZH1cIiBkYXRhLXNyYz1cIiR7dXJsfVwiPjwvYXVkaW8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGRpdiBjbGFzcz1cInVpIHJhbmdlIGNkci1wbGF5ZXJcIj48L2Rpdj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cIm9uZSB3aWRlXCI+PHNwYW4gY2xhc3M9XCJjZHItZHVyYXRpb25cIj4tLTotLTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90cj48L3RhYmxlPmA7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6ICdjb252ZXJ0ZWQnLFxuICAgICAgICAgICAgICAgICAgICBvcmRlcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdjZW50ZXIgYWxpZ25lZCBjb2xsYXBzaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyOiAoZGF0YSwgdHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUgIT09ICdkaXNwbGF5JykgcmV0dXJuIGRhdGEgPyAxIDogMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnPGkgY2xhc3M9XCJncmVlbiBjaGVjayBpY29uXCI+PC9pPidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICc8aSBjbGFzcz1cImdyZXkgaG91cmdsYXNzIGhhbGYgaWNvblwiPjwvaT4nO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBvcmRlcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiAncmlnaHQgYWxpZ25lZCBjb2xsYXBzaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgaXNBY3Rpb25Db2x1bW46IHRydWUsIC8vIHN1cHByZXNzZXMgYmFzZSBjbGFzcyBhdXRvLWluamVjdGVkIGFjdGlvbiBjb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyOiAoZGF0YSwgdHlwZSwgcm93KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSAhPT0gJ2Rpc3BsYXknKSByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1cmwgPSBTZWN1cml0eVV0aWxzLmVzY2FwZUh0bWwocm93LmRvd25sb2FkVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ1aSBpY29uIGJhc2ljIGNvbXBhY3QgYnV0dG9uIGRvd25sb2FkLWJ1dHRvblwiIGRhdGEtdmFsdWU9XCIke3VybH1cIj48aSBjbGFzcz1cImRvd25sb2FkIGljb25cIj48L2k+PC9idXR0b24+YDtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIC8vIFNlcnZlci1zaWRlIG92ZXJyaWRlcyBvbiB0b3Agb2YgdGhlIGJhc2UgY29uZmlnIChzcHJlYWQgbGFzdCkuXG4gICAgICAgICAgICBkYXRhVGFibGVPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgc2VydmVyU2lkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBwcm9jZXNzaW5nOiB0cnVlLFxuICAgICAgICAgICAgICAgIHBhZ2luZzogdHJ1ZSxcbiAgICAgICAgICAgICAgICBsZW5ndGhDaGFuZ2U6IHRydWUsXG4gICAgICAgICAgICAgICAgcGFnZUxlbmd0aDogNTAsXG4gICAgICAgICAgICAgICAgbGVuZ3RoTWVudTogW1syNSwgNTAsIDEwMCwgMjAwXSwgWzI1LCA1MCwgMTAwLCAyMDBdXSxcbiAgICAgICAgICAgICAgICBzZWFyY2hEZWxheTogNDAwLFxuICAgICAgICAgICAgICAgIHJvd0lkOiAnaWQnLFxuICAgICAgICAgICAgICAgIGNyZWF0ZWRSb3cocm93KSB7XG4gICAgICAgICAgICAgICAgICAgICQocm93KS5hZGRDbGFzcygnZmlsZS1yb3cnKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFqYXgoZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgTGFuZ3VhZ2VQYWNrU291bmRzQVBJLmdldExpc3QoZGF0YSwgKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEcml2ZSBjb250YWluZXIvbG9hZGVyIHZpc2liaWxpdHkgb3Vyc2VsdmVzOiB3aGVuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBgYWpheGAgaXMgb3ZlcnJpZGRlbiB2aWEgZGF0YVRhYmxlT3B0aW9ucywgdGhlIGJhc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNsYXNzJ3MgaGV1cmlzdGljIGZvciBsb2NhdGluZyBvdXIgY29udGFpbmVyIGZpcmVzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBiZWZvcmUgRGF0YVRhYmxlcyB3cmFwcyB0aGUgdGFibGUgYW5kIGdldHMgY29uZnVzZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YWJsZUNvbnRhaW5lcklkID0gJ2xhbmd1YWdlcGFjay1zb3VuZHMtdGFibGUtY29udGFpbmVyJztcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNwb25zZSB8fCByZXNwb25zZS5yZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnI3RhYmxlLWRhdGEtbG9hZGVyJykuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoYCMke3RhYmxlQ29udGFpbmVySWR9YCkuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJyNlbXB0eS10YWJsZS1wbGFjZWhvbGRlcicpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRyYXc6IGRhdGEuZHJhdyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjb3Jkc1RvdGFsOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNvcmRzRmlsdGVyZWQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVjb3Jkc1RvdGFsID0gcmVzcG9uc2UucmVjb3Jkc1RvdGFsIHx8IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWNvcmRzRmlsdGVyZWQgPSByZXNwb25zZS5yZWNvcmRzRmlsdGVyZWQgfHwgMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI3RhYmxlLWRhdGEtbG9hZGVyJykuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlY29yZHNUb3RhbCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoYCMke3RhYmxlQ29udGFpbmVySWR9YCkuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJyNlbXB0eS10YWJsZS1wbGFjZWhvbGRlcicpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnI2VtcHR5LXRhYmxlLXBsYWNlaG9sZGVyJykuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoYCMke3RhYmxlQ29udGFpbmVySWR9YCkuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJhdzogcmVzcG9uc2UuZHJhdyB8fCBkYXRhLmRyYXcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjb3Jkc1RvdGFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY29yZHNGaWx0ZXJlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiByZXNwb25zZS5kYXRhIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25EcmF3Q2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAkKCcjbGFuZ3VhZ2VwYWNrLXNvdW5kcy10YWJsZScpLmZpbmQoJ3RyLmZpbGUtcm93JykuZWFjaCgoXywgdHIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2tpcCByb3dzIHRoYXQgZG9uJ3QgaGF2ZSBhIHBsYXlhYmxlIHZhcmlhbnQg4oCUIHRoZWlyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNlbGwgcmVuZGVycyBhIFwi4oCUXCIgcGxhY2Vob2xkZXIgaW5zdGVhZCBvZiBhdWRpbyBtYXJrdXAsXG4gICAgICAgICAgICAgICAgICAgIC8vIGFuZCBJbmRleFNvdW5kUGxheWVyIHdvdWxkIHRocm93IHdpdGhvdXQgYW4gPGF1ZGlvPi5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0ci5pZCB8fCB0eXBlb2YgSW5kZXhTb3VuZFBsYXllciA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgYXVkaW8tcGxheWVyLSR7dHIuaWR9YCkpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5ld1xuICAgICAgICAgICAgICAgICAgICBuZXcgSW5kZXhTb3VuZFBsYXllcih0ci5pZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBscFNvdW5kc0luZGV4LmRhdGFUYWJsZUluc3RhbmNlLmluaXRpYWxpemUoKTtcbiAgICB9LFxufTtcblxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuICAgIGxwU291bmRzSW5kZXguaW5pdGlhbGl6ZSgpO1xufSk7XG4iXX0=