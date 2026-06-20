# companion-module-foshow

A [Bitfocus Companion](https://bitfocus.io/companion) module for **FoShow**, a macOS broadcast playout
application. The module drives FoShow through its HTTP/JSON control surface and mirrors FoShow's live
state back into Companion variables and button feedbacks.

> Built against the Companion 4.x SDK (`@companion-module/base` 2.x / `node22` runtime).

## Features

- **Transport:** Play, Pause, Play/Pause toggle, Stop, Next, Previous, Jump to In/Out-point, Seek.
- **Cueing:** Cue any clip from a dropdown that stays in sync with the current playlist.
- **Playlists:** Switch between playlists from a dropdown of everything FoShow knows about.
- **Audio:** Set volume (0–100 %), set mute, toggle mute.
- **DSK:** Fade to Black / Restore from Black with configurable durations.
- **Live feedbacks:** playing, blacked-out, transitioning, ready-to-play, muted, on-air clip, loaded playlist.
- **Variables:** clip name, playlist name, timers (`mm:ss` / `hh:mm:ss`), volume, mute state, channel, and more.
- **Preset pack** so a fresh install has useful buttons immediately.
- **Bonjour auto-discovery** of `_foshow._tcp` instances on the LAN (optional).

## Setup

1. In FoShow, open **Settings → Remote Control**, enable the HTTP API and note the **port** (default `7878`) and **API token**.
2. In Companion, add a new connection and search for **FoShow**.
3. Enter the **Host/IP** of the Mac running FoShow and paste the **API token**.
   - Or pick the instance from **Auto-discover (Bonjour)** if it's on the same LAN.
4. The connection goes green once Companion reads `/status`. The Companion log will show the FoShow app version on first connect.

See [companion/HELP.md](./companion/HELP.md) for the full reference.

## Actions

| Action             | Options             | Description                             |
| ------------------ | ------------------- | --------------------------------------- |
| Play               | —                   | Start playback                          |
| Pause              | —                   | Pause playback                          |
| Play/Pause Toggle  | —                   | Toggle between play and pause           |
| Stop               | —                   | Stop and reset to beginning             |
| Next item          | —                   | Jump to the next item in the playlist   |
| Previous item      | —                   | Jump to the previous item               |
| Jump to In-point   | —                   | Seek to the current item's in-point     |
| Jump to Out-point  | —                   | Seek to the current item's out-point    |
| Cue Clip           | Clip (dropdown)     | Load a specific clip by position        |
| Seek               | Position (seconds)  | Seek to an absolute time                |
| Set Volume         | Volume 0–100 %      | Set master output volume                |
| Set Mute           | Muted on/off        | Set mute state explicitly               |
| Toggle Mute        | —                   | Toggle mute on/off                      |
| Fade to Black      | Duration (s)        | Fade output to black (default 1.0 s)    |
| Restore from Black | Duration (s)        | Clear the black overlay (default 0.5 s) |
| Switch Playlist    | Playlist (dropdown) | Load a different playlist               |

## Feedbacks

| Feedback                 | Description                                    |
| ------------------------ | ---------------------------------------------- |
| Playback is running      | True while FoShow is playing                   |
| Output is faded to black | True while the DSK overlay is active           |
| Transition in progress   | True during a crossfade                        |
| Ready to play            | True when a clip is cued and ready             |
| Audio is muted           | True while master audio is muted               |
| Clip is on-air           | True when the item at a given index is current |
| Playlist is loaded       | True when the selected playlist is active      |

## Variables

| Variable                           | Type    | Description                        |
| ---------------------------------- | ------- | ---------------------------------- |
| `$(FoShow:is_playing)`             | 0/1     | Playback running                   |
| `$(FoShow:is_blacked_out)`         | 0/1     | DSK overlay active                 |
| `$(FoShow:is_transitioning)`       | 0/1     | Transition in progress             |
| `$(FoShow:is_ready_to_play)`       | 0/1     | Clip cued and ready                |
| `$(FoShow:is_muted)`               | 0/1     | Master audio muted                 |
| `$(FoShow:master_volume)`          | 0–100   | Master volume as a percentage      |
| `$(FoShow:current_item_index)`     | integer | 0-based index of the current item  |
| `$(FoShow:current_clip_name)`      | string  | Filename of the current clip       |
| `$(FoShow:current_playlist_name)`  | string  | Name of the loaded playlist        |
| `$(FoShow:current_time)`           | mm:ss   | Playhead position                  |
| `$(FoShow:duration)`               | mm:ss   | Current item duration              |
| `$(FoShow:time_remaining)`         | mm:ss   | Time remaining in the current item |
| `$(FoShow:time_remaining_seconds)` | float   | Time remaining in seconds (raw)    |
| `$(FoShow:active_channel)`         | a/b     | Active A/B player channel          |

## Connection states

| State              | Meaning                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| OK (green)         | `/status` is being polled successfully                                   |
| Connecting         | First poll in progress after (re)configuration                           |
| Bad config         | Missing host/token, or the token was rejected (HTTP 401)                 |
| Connection failure | Host unreachable / timed out; retries with exponential backoff up to 5 s |

## Development

```sh
corepack enable          # this module uses yarn 4 via corepack
yarn install
yarn lint                # prettier --check + eslint
yarn format              # prettier --write
yarn package             # build the installable .tgz with companion-module-build
```

The module is plain JavaScript, one file per concern:

| File               | Responsibility                                                     |
| ------------------ | ------------------------------------------------------------------ |
| `src/main.js`      | Instance class: config, lifecycle, polling, dynamic dropdowns      |
| `src/api.js`       | HTTP client — single `request()` helper, bearer auth, typed errors |
| `src/actions.js`   | Action definitions                                                 |
| `src/feedbacks.js` | Boolean feedbacks (read from cached status)                        |
| `src/variables.js` | Variable definitions + value/formatting helpers                    |
| `src/presets.js`   | Starter preset pack                                                |

## Screenshots

> _TODO: add screenshots of the connection config, the preset pack, and an example button page._
>
> Suggested shots: `docs/config.png`, `docs/presets.png`, `docs/buttons.png`.

## License

[MIT](./LICENSE)
