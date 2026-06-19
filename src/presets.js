/**
 * Starter preset pack.
 *
 * Uses the sectioned preset API: `setPresetDefinitions(structure, presets)`,
 * where `structure` lists sections referencing preset ids and `presets` is the
 * id → definition map.
 *
 * Variable references such as `$(FoShow:current_clip_name)` use the connection's
 * default label (derived from the module shortname "FoShow"); Companion relabels
 * them automatically if the connection is renamed.
 */

const { combineRgb } = require('@companion-module/base')

const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)
const DARK = combineRgb(27, 27, 27)
const GREEN = combineRgb(0, 153, 51)
const RED = combineRgb(204, 0, 0)

/** Build a one-step button preset that fires a single action on press. */
function actionButton(name, text, actionId, options = {}, extra = {}) {
	return {
		type: 'simple',
		name,
		style: { text, size: '18', color: WHITE, bgcolor: DARK, ...(extra.style || {}) },
		steps: [{ down: [{ actionId, options }], up: [] }],
		feedbacks: extra.feedbacks || [],
	}
}

module.exports = function UpdatePresets(self) {
	const presets = {
		play: actionButton('Play', 'Play', 'play'),
		pause: actionButton('Pause', 'Pause', 'pause'),

		toggle: actionButton(
			'Play / Pause toggle',
			'Play\\n/\\nPause',
			'toggle',
			{},
			{
				feedbacks: [{ feedbackId: 'isPlaying', options: {}, style: { bgcolor: GREEN, color: WHITE } }],
			},
		),

		next: actionButton('Next item', 'Next\\n▶▶', 'next'),
		previous: actionButton('Previous item', '◀◀\\nPrev', 'previous'),

		fadeToBlack: actionButton(
			'Fade to Black',
			'Fade to\\nBlack',
			'fadeToBlack',
			{ duration: 1.0 },
			{
				feedbacks: [{ feedbackId: 'isBlackedOut', options: {}, style: { bgcolor: RED, color: WHITE } }],
			},
		),

		clearBlack: actionButton('Restore from Black', 'Restore', 'clearBlack', { duration: 0.5 }),

		nowPlaying: {
			type: 'simple',
			name: 'Now Playing (text)',
			style: {
				text: '$(FoShow:current_clip_name)\\n$(FoShow:time_remaining)',
				size: 'auto',
				color: WHITE,
				bgcolor: BLACK,
			},
			steps: [{ down: [], up: [] }],
			feedbacks: [{ feedbackId: 'isPlaying', options: {}, style: { color: GREEN } }],
		},
	}

	const structure = [
		{
			id: 'transport',
			name: 'Transport & DSK',
			definitions: ['play', 'pause', 'toggle', 'next', 'previous', 'fadeToBlack', 'clearBlack', 'nowPlaying'],
		},
	]

	self.setPresetDefinitions(structure, presets)
}
