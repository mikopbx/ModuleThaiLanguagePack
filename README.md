# ModuleThaiLanguagePack

Complete Thai language pack for MikoPBX including UI translations and TTS-generated voice prompts.

## What's Included

- **Voice Prompts**: 568 Thai voice prompts (16000 Hz, mono, 16-bit PCM WAV)
- **UI Translations**: Complete Thai translation of MikoPBX admin interface (17 translation files)
- **Text Mapping**: `Sounds/core-sounds-th-th.txt` — full list of prompts with text

## Voice Generation

Voice prompts were generated using neural TTS (Text-to-Speech) technology:

- **Engine**: [Meta MMS-TTS](https://huggingface.co/facebook/mms-tts)
- **Voice model**: `facebook/mms-tts-tha`
- **Sample rate**: 16000 Hz
- **Format**: WAV (PCM signed 16-bit, mono)

The text for each prompt is stored in `Sounds/core-sounds-th-th.txt` for reference and regeneration.

On module installation, MikoPBX automatically converts WAV files to all Asterisk formats (ulaw, alaw, gsm, g722, sln) for optimal codec compatibility.

## Installation

1. Download and install the module from MikoPBX Marketplace
2. Enable the module in **Modules** section
3. Go to **General Settings** and select Thai (ไทย) as the system language

## Requirements

- MikoPBX 2025.1.1 or later

## License

- Module code: GNU General Public License v3.0
- Sound files: CC BY-SA 4.0
- TTS engine: Meta MMS-TTS (https://huggingface.co/facebook/mms-tts)

## Copyright

- Module development: © 2017-2025 Alexey Portnov and Nikolay Beketov
- Voice synthesis: Generated using open-source TTS models
- Remaining system sounds (silence, tones): From official Asterisk release (CC BY-SA 4.0)
