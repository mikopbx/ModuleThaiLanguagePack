<div class="ui segment">
    <h2 class="ui header">
        <i class="thailand flag"></i>
        <div class="content">
            {{ t._('BreadcrumbModuleThaiLanguagePack') }}
            <div class="sub header">{{ t._('SubHeaderModuleThaiLanguagePack') }}</div>
        </div>
    </h2>

    <div class="ui three statistics">
        <div class="statistic">
            <div class="value">
                <i class="microphone icon"></i> {{ soundFileCount }}
            </div>
            <div class="label">{{ t._('mlp_SoundFiles') }}</div>
        </div>
        <div class="statistic">
            <div class="value">
                <i class="file alternate icon"></i> {{ translationFileCount }}
            </div>
            <div class="label">{{ t._('mlp_TranslationFiles') }}</div>
        </div>
        <div class="statistic">
            <div class="value">
                <i class="language icon"></i> {{ translationStringCount }}
            </div>
            <div class="label">{{ t._('mlp_TranslationStrings') }}</div>
        </div>
    </div>

    <div class="ui info message">
        <div class="header">
            <i class="info circle icon"></i>
            {{ t._('mlp_HowToUse') }}
        </div>
        <p>{{ t._('mlp_Step1') }}</p>
    </div>

    <a href="{{ url('general-settings/modify') }}" class="ui primary button">
        <i class="cog icon"></i>
        {{ t._('mlp_GoToGeneralSettings') }}
    </a>

    <div class="ui divider"></div>

    <div class="ui two column stackable grid">
        <div class="column">
            <h3 class="ui header">
                <i class="certificate icon"></i>
                <div class="content">
                    {{ t._('mlp_LicenseHeader') }}
                </div>
            </h3>
            <div class="ui list">
                <div class="item">
                    <i class="file code icon"></i>
                    <div class="content">
                        <div class="header">{{ t._('mlp_ModuleCode') }}</div>
                        <div class="description">GNU General Public License v3.0</div>
                    </div>
                </div>
                <div class="item">
                    <i class="microphone icon"></i>
                    <div class="content">
                        <div class="header">{{ t._('mlp_SoundFilesLicense') }}</div>
                        <div class="description">{{ t._('mlp_SoundFilesLicenseText') }}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="column">
            <h3 class="ui header">
                <i class="copyright icon"></i>
                <div class="content">
                    {{ t._('mlp_CopyrightHeader') }}
                </div>
            </h3>
            <div class="ui list">
                <div class="item">
                    <i class="code icon"></i>
                    <div class="content">
                        <div class="header">{{ t._('mlp_ModuleDevelopment') }}</div>
                        <div class="description">&copy; 2017-2025 Alexey Portnov and Nikolay Beketov</div>
                    </div>
                </div>
                <div class="item">
                    <i class="sound icon"></i>
                    <div class="content">
                        <div class="header">{{ t._('mlp_VoicePrompts') }}</div>
                        <div class="description">{{ t._('mlp_VoicePromptsSource') }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
