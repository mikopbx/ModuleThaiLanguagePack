<div class="ui segment">
    <div class="ui labels" style="margin-bottom: 1em;">
        <a class="ui basic label">
            <i class="microphone icon"></i> {{ soundFileCount }}
            {{ t._('mlp_th_SoundFiles') }}
        </a>
        <a class="ui basic label">
            <i class="file alternate icon"></i> {{ translationFileCount }}
            {{ t._('mlp_th_TranslationFiles') }}
        </a>
        <a class="ui basic label">
            <i class="language icon"></i> {{ translationStringCount }}
            {{ t._('mlp_th_TranslationStrings') }}
        </a>
    </div>

    <div class="ui info message">
        <p>
            <i class="info circle icon"></i>
            {{ t._('mlp_th_Step1') }}
            <a href="{{ url('general-settings/modify') }}" class="ui" style="margin-left: 0.5em;">
                <i class="cog icon"></i>{{ t._('mlp_th_GoToGeneralSettings') }}
            </a>
        </p>
    </div>

    <div class="ui message">
        <p>
            <i class="users icon"></i>
            {{ t._('mlp_th_HelpTranslate') }}
            <a href="https://weblate.mikopbx.com/projects/mikopbx/" target="_blank" style="margin-left: 0.5em;">
                <i class="external alternate icon"></i>{{ t._('mlp_th_WeblateLink') }}
            </a>
        </p>
    </div>

    <div class="ui horizontal list" style="color: #999; font-size: 0.85em;">
        <div class="item">
            <i class="file code outline icon"></i> GPL v3.0
        </div>
        <div class="item">
            <i class="microphone icon"></i> CC BY-SA 4.0
        </div>
        <div class="item">
            <i class="copyright outline icon"></i> MikoPBX 2017-2026
        </div>
    </div>
</div>
