## FoShow

Control the **FoShow** macOS broadcast playout application from Bitfocus Companion over its HTTP/JSON control surface.

### Configuration

| Field                  | Description                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Host / IP**          | Address of the Mac running FoShow (e.g. `192.168.0.12`).                                                                                |
| **Port**               | FoShow API port. Default `7878`.                                                                                                        |
| **API token**          | Bearer token from FoShow's settings. Sent as `Authorization: Bearer <token>` on every call.                                             |
| **Poll interval (ms)** | How often Companion requests `/status`. Default `250`, minimum `100`.                                                                   |
| **Auto-discover**      | Optionally pick a FoShow instance advertised on the LAN via Bonjour (`_FoShow._tcp`). When a device is selected it overrides Host/Port. |

The connection turns **green (OK)** once `/status` is read successfully. A bad/missing token shows as **Bad config (401)**; an unreachable host shows as **Connection failure** while Companion retries with a backoff up to 5 seconds.

### Actions

| Action                | Notes                                                               |
| --------------------- | ------------------------------------------------------------------- |
| Play / Pause / Toggle | Transport control.                                                  |
| Next / Previous       | Move between playlist items.                                        |
| Cue Clip              | Dropdown of the current playlist's items (kept in sync by polling). |
| Seek (seconds)        | Jump to a position in the current item.                             |
| Fade to Black         | DSK fade out. Duration in seconds (default `1.0`).                  |
| Restore from Black    | Fade back in. Duration in seconds (default `0.5`).                  |
| Switch Playlist       | Dropdown of all playlists (kept in sync by polling).                |

### Feedbacks

Use these to style buttons. All read from the most recent poll — they do not make extra requests.

- **Playback is running** – green while playing.
- **Output is faded to black** – red while blacked out.
- **Transition in progress** – amber during a crossfade.
- **Clip is on-air** – true when the item at the given index is current (for clip-grid layouts).
- **Playlist is loaded** – true when the selected playlist is current (for playlist-row pages).

### Variables

`is_playing`, `is_blacked_out`, `is_transitioning`, `current_item_index`, `current_clip_name`,
`current_playlist_name`, `current_time`, `duration`, `time_remaining`, `time_remaining_seconds`,
`active_channel`.

Time variables are formatted `m:ss` (or `h:mm:ss` past an hour); `time_remaining_seconds` is the raw value.

### Presets

A starter pack is provided under **Transport & DSK**: Play, Pause, Play/Pause toggle (lit by the playing feedback), Next, Previous, Fade to Black (lit red when active), Restore from Black, and a text-only **Now Playing** button showing the current clip name and time remaining.
