/**
 * Boolean feedbacks. Every callback reads the cached `self.lastStatus` snapshot
 * that the poller refreshes — feedbacks never make their own HTTP calls.
 */

const { combineRgb } = require('@companion-module/base')

const COLOR_WHITE = combineRgb(255, 255, 255)
const COLOR_BLACK = combineRgb(0, 0, 0)
const COLOR_GREEN = combineRgb(0, 153, 51)
const COLOR_RED = combineRgb(204, 0, 0)
const COLOR_AMBER = combineRgb(230, 153, 0)

module.exports = function UpdateFeedbacks(self) {
	self.setFeedbackDefinitions({
		isPlaying: {
			name: 'Playback is running',
			type: 'boolean',
			description: 'True while FoShow is playing. Ideal for a Play/Pause button highlight.',
			defaultStyle: { bgcolor: COLOR_GREEN, color: COLOR_WHITE },
			options: [],
			callback: () => self.lastStatus?.isPlaying === true,
		},

		isBlackedOut: {
			name: 'Output is faded to black',
			type: 'boolean',
			description: 'True while the DSK is faded to black. Turns the button red by default.',
			defaultStyle: { bgcolor: COLOR_RED, color: COLOR_WHITE },
			options: [],
			callback: () => self.lastStatus?.isBlackedOut === true,
		},

		isTransitioning: {
			name: 'Transition in progress',
			type: 'boolean',
			description: 'True during a crossfade/transition.',
			defaultStyle: { bgcolor: COLOR_AMBER, color: COLOR_BLACK },
			options: [],
			callback: () => self.lastStatus?.isTransitioning === true,
		},

		isMuted: {
			name: 'Audio is muted',
			type: 'boolean',
			description: 'True while master audio is muted.',
			defaultStyle: { bgcolor: COLOR_AMBER, color: COLOR_BLACK },
			options: [],
			callback: () => self.lastStatus?.isMuted === true,
		},

		isCurrentClip: {
			name: 'Clip is on-air',
			type: 'boolean',
			description: 'True when the item at the given index is the current (on-air) item.',
			defaultStyle: { bgcolor: COLOR_GREEN, color: COLOR_WHITE },
			options: [
				{
					id: 'index',
					type: 'number',
					label: 'Item index (0-based)',
					default: 0,
					min: 0,
					max: 999,
				},
			],
			callback: (feedback) => self.lastStatus?.currentItemIndex === Number(feedback.options.index),
		},

		isCurrentPlaylist: {
			name: 'Playlist is loaded',
			type: 'boolean',
			description: 'True when the selected playlist is the current playlist.',
			defaultStyle: { bgcolor: COLOR_GREEN, color: COLOR_WHITE },
			options: [
				{
					id: 'playlist',
					type: 'dropdown',
					label: 'Playlist',
					default: self.getPlaylistChoices()[0]?.id ?? '',
					choices: self.getPlaylistChoices(),
					allowCustom: true,
				},
			],
			callback: (feedback) => {
				const id = self.lastStatus?.currentPlaylist?.id
				return id !== undefined && id === feedback.options.playlist
			},
		},
	})
}
