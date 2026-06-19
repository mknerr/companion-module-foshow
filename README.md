# companion-module-foshow

A [Bitfocus Companion](https://bitfocus.io/companion) module for **FoShow**, a macOS broadcast playout
application. The module drives FoShow through its HTTP/JSON control surface — transport, cueing,
playlist switching and the downstream-key (DSK) fade-to-black — and mirrors FoShow's live state back
into Companion variables and button feedbacks.

> Built against the Companion 4.x SDK (`@companion-module/base` 2.x / `node22` runtime).

## Features

- **Transport:** Play, Pause, Play/Pause toggle, Next, Previous, Seek.
- **Cueing:** Cue any clip from a dropdown that stays in sync with the current playlist.
- **Playlists:** Switch between playlists from a dropdown of everything FoShow knows about.
- **DSK:** Fade to Black / Restore from Black with configurable durations.
- **Live feedbacks:** playing, blacked-out, transitioning, on-air clip, loaded playlist.
- **Variables:** clip name, playlist name, timers (`mm:ss` / `hh:mm:ss`), channel, and more.
- **Preset pack** so a fresh install has useful buttons immediately.
- **Bonjour auto-discovery** of `_FoShow._tcp` instances on the LAN (optional).

## Setup

1. In FoShow, enable the HTTP control API and note its **port** (default `7878`) and **API token**.
2. In Companion, add a new connection and search for **FoShow**.
3. Enter the **Host/IP** of the Mac running FoShow and paste the **API token**.
   - Or pick the instance from **Auto-discover (Bonjour)** if it's on the same LAN.
4. The connection goes green once Companion reads `/status`.

See [companion/HELP.md](./companion/HELP.md) for the full reference of actions, feedbacks, and variables.

## Connection states

| State              | Meaning                                                           |
| ------------------ | ----------------------------------------------------------------- |
| OK (green)         | `/status` is being read successfully.                             |
| Connecting         | First poll in progress after (re)configuration.                   |
| Bad config         | Missing host/token, or the token was rejected (HTTP 401).         |
| Connection failure | Host unreachable / timed out; Companion retries with backoff ≤5s. |

## Development

```sh
corepack enable          # this module uses yarn 4 via corepack
yarn install
yarn lint                # prettier --check + eslint
yarn format              # prettier --write
yarn package             # build the installable .tgz with companion-module-build
```

The module is plain JavaScript, one file per concern:

| File               | Responsibility                                                      |
| ------------------ | ------------------------------------------------------------------- |
| `src/main.js`      | Instance class: config, lifecycle, polling, dynamic dropdowns.      |
| `src/api.js`       | HTTP client — single `request()` helper, bearer auth, typed errors. |
| `src/actions.js`   | Action definitions.                                                 |
| `src/feedbacks.js` | Boolean feedbacks (read from cached status).                        |
| `src/variables.js` | Variable definitions + value/formatting helpers.                    |
| `src/presets.js`   | Starter preset pack.                                                |

## Screenshots

> _TODO: add screenshots of the connection config, the preset pack, and an example button page._
>
> Suggested shots: `docs/config.png`, `docs/presets.png`, `docs/buttons.png`.

## License

[MIT](./LICENSE)
