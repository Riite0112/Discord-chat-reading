# Discord Chat Reader

Prototype Chrome extension for reading Discord Web chat aloud.

## Features

- Watches the currently open Discord chat for new messages
- On load or channel switch, existing visible messages are marked as already seen and are not auto-read
- Prevents recently spoken messages from being replayed again immediately
- Reads messages as `name: message`
- Reuses the grouped / last spoken author for Discord continuation messages that do not show a visible name
- Can skip author names entirely
- Converts links into a short "link sent" announcement
- Can disable link announcements entirely
- Can announce image-only messages
- Can announce emoji-only messages
- Can ignore selected authors
- Adds a button to read the latest visible message on demand
- Keeps a recent spoken log of about 30 entries and uses it to avoid re-reading
- Allows repeated reading for short event notices such as link/image-only announcements
- Removes URLs from speech
- Skips embeds and media-heavy accessories as much as possible
- Tries not to read badge-like UI around usernames
- Strips badge-like labels such as `[NEKO]` and `YouTube Member: ...` from speech text
- Supports Japanese, English, Chinese, and Korean UI / notice text
- Popup controls for enable/disable, rate up to 2.0x, pitch, volume, voice, and reading rules
- Optional VOICEVOX support for voices such as Zundamon through a local VOICEVOX engine
- Test playback button to confirm Chrome TTS is working
- Toolbar icon changes between ON and OFF states
- Includes Memory Saver guidance for keeping Discord active in the background

## Intended use

- Open Discord in Chrome
- Keep the target text chat visible
- After opening the target chat, press `Test playback` first to confirm audio works
- Enable the extension
- Listen for newly added chat messages

## VOICEVOX voices

1. Start VOICEVOX on the same computer
2. Open the extension popup
3. Change the speech engine from Chrome voice to VOICEVOX
4. Click refresh speakers and choose a speaker such as Zundamon
5. Press `Test playback`

## Install

1. Open `chrome://extensions/`
2. Turn on Developer mode
3. Click `Load unpacked`
4. Select this folder

## Notes

- Discord changes its DOM often, so selectors may need adjustment later
- This currently targets `https://discord.com/channels/*`
- On page refresh, visible history is ignored and nothing is auto-read
- Available voices depend on Chrome and the OS
- VOICEVOX voices require the local VOICEVOX engine, usually at `http://127.0.0.1:50021`
- This version cannot choose a physical speaker device directly
- Audio output follows the current Chrome / OS default output device
