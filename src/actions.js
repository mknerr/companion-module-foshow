/**
 * Action definitions.
 *
 * Each callback delegates the actual HTTP call to `self.doAction()`, which owns
 * error handling, connection-state updates, and a quick post-command refresh.
 *
 * The "Cue Clip" and "Switch Playlist" dropdowns are populated from polled state
 * via `self.getClipChoices()` / `self.getPlaylistChoices()`; the instance
 * re-runs `updateActions()` whenever that state changes so the choices stay current.
 */

module.exports = function UpdateActions(self) {
	const clipChoices = self.getClipChoices()
	const playlistChoices = self.getPlaylistChoices()

	self.setActionDefinitions({
		play: {
			name: 'Play',
			options: [],
			callback: () => self.doAction((api) => api.play()),
		},

		pause: {
			name: 'Pause',
			options: [],
			callback: () => self.doAction((api) => api.pause()),
		},

		toggle: {
			name: 'Play/Pause Toggle',
			options: [],
			callback: () => self.doAction((api) => api.toggle()),
		},

		next: {
			name: 'Next item',
			options: [],
			callback: () => self.doAction((api) => api.next()),
		},

		previous: {
			name: 'Previous item',
			options: [],
			callback: () => self.doAction((api) => api.previous()),
		},

		stop: {
			name: 'Stop',
			options: [],
			callback: () => self.doAction((api) => api.stop()),
		},

		jumpToIn: {
			name: 'Jump to In-point',
			options: [],
			callback: () => self.doAction((api) => api.jumpToIn()),
		},

		jumpToOut: {
			name: 'Jump to Out-point',
			options: [],
			callback: () => self.doAction((api) => api.jumpToOut()),
		},

		cue: {
			name: 'Cue Clip',
			options: [
				{
					id: 'index',
					type: 'dropdown',
					label: 'Clip',
					default: clipChoices[0]?.id ?? 0,
					choices: clipChoices,
					allowCustom: true,
					tooltip: 'Items from the current playlist. Custom values are treated as a 0-based index.',
				},
			],
			callback: (event) => self.doAction((api) => api.cue(Number(event.options.index))),
		},

		seek: {
			name: 'Seek (seconds)',
			options: [
				{
					id: 'time',
					type: 'number',
					label: 'Position (seconds)',
					default: 0,
					min: 0,
					max: 86400,
					step: 1,
				},
			],
			callback: (event) => self.doAction((api) => api.seek(Number(event.options.time))),
		},

		fadeToBlack: {
			name: 'Fade to Black',
			options: [
				{
					id: 'duration',
					type: 'number',
					label: 'Duration (seconds)',
					default: 1.0,
					min: 0,
					max: 60,
					step: 0.1,
				},
			],
			callback: (event) => self.doAction((api) => api.fadeToBlack(Number(event.options.duration))),
		},

		clearBlack: {
			name: 'Restore from Black',
			options: [
				{
					id: 'duration',
					type: 'number',
					label: 'Duration (seconds)',
					default: 0.5,
					min: 0,
					max: 60,
					step: 0.1,
				},
			],
			callback: (event) => self.doAction((api) => api.clearBlack(Number(event.options.duration))),
		},

		switchPlaylist: {
			name: 'Switch Playlist',
			options: [
				{
					id: 'playlist',
					type: 'dropdown',
					label: 'Playlist',
					default: playlistChoices[0]?.id ?? '',
					choices: playlistChoices,
					allowCustom: true,
					tooltip: 'All playlists known to FoShow. Custom values are treated as a playlist UUID.',
				},
			],
			callback: (event) => self.doAction((api) => api.loadPlaylist(String(event.options.playlist))),
		},
	})
}
