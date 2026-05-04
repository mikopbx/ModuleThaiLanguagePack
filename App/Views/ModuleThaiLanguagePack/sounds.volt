<style>
    #languagepack-sounds-table th.cdr-player-column,
    #languagepack-sounds-table td.cdr-player {
        min-width: 320px;
    }
    #languagepack-sounds-table td.cdr-player > table {
        width: 100%;
    }
    #languagepack-sounds-table td.cdr-player .ui.range {
        width: 100%;
    }
</style>
<div class="ui segment">
    <a class="ui basic compact button"
       href="{{ url('module-thai-language-pack/module-thai-language-pack/index') }}">
        <i class="left arrow icon"></i>{{ t._('mlp_th_BackToOverview') }}
    </a>

    <div id="languagepack-sounds-table-container" style="margin-top: 1em;">
        <table class="ui selectable compact unstackable table" id="languagepack-sounds-table">
            <thead>
                <tr>
                    <th>{{ t._('mlp_th_ColumnFile') }}</th>
                    <th class="cdr-player-column">{{ t._('mlp_th_ColumnPlayer') }}</th>
                    <th>{{ t._('mlp_th_ColumnConverted') }}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>

    <div id="empty-table-placeholder" style="display:none">
        {{ partial("partials/emptyTablePlaceholder", [
            'icon': 'music',
            'title': t._('mlp_th_EmptyTable'),
            'description': '',
            'showButton': false,
            'showDocumentationLink': false
        ]) }}
    </div>
</div>
