/**
 * Variable definitions and value computation.
 *
 * Definitions are static; values are recomputed from each polled `/status`
 * snapshot by `buildVariableValues()` and pushed with `setVariableValues()`.
 */

/**
 * Format a number of seconds as `m:ss`, or `h:mm:ss` once it reaches an hour —
 * the way a typical video timer behaves. Returns `00:00` for missing/invalid input.
 *
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatTime(totalSeconds) {
	if (totalSeconds === null || totalSeconds === undefined || Number.isNaN(Number(totalSeconds))) {
		return '00:00'
	}

	const sign = totalSeconds < 0 ? '-' : ''
	const whole = Math.floor(Math.abs(Number(totalSeconds)))
	const hours = Math.floor(whole / 3600)
	const minutes = Math.floor((whole % 3600) / 60)
	const seconds = whole % 60

	const pad = (n) => String(n).padStart(2, '0')

	if (hours > 0) {
		return `${sign}${hours}:${pad(minutes)}:${pad(seconds)}`
	}
	return `${sign}${minutes}:${pad(seconds)}`
}

/**
 * The current item's filename, or '' when nothing is cued.
 * @param {object|null} status
 * @returns {string}
 */
function currentClipName(status) {
	const items = status?.currentPlaylist?.items
	if (!Array.isArray(items)) return ''
	const item = items.find((i) => i.order === status.currentItemIndex) ?? items[status.currentItemIndex]
	return item?.fileName ?? ''
}

/**
 * Compute the full variable value map from a polled status snapshot.
 * When `status` is null (disconnected) sensible empty/zero values are returned.
 *
 * @param {object|null} status
 * @returns {Record<string, string|number>}
 */
function buildVariableValues(status) {
	if (!status) {
		return {
			is_playing: 0,
			is_blacked_out: 0,
			is_transitioning: 0,
			is_muted: 0,
			is_ready_to_play: 0,
			master_volume: 100,
			current_item_index: 0,
			current_clip_name: '',
			current_playlist_name: '',
			current_time: '00:00',
			duration: '00:00',
			time_remaining: '00:00',
			time_remaining_seconds: 0,
			active_channel: '',
		}
	}

	return {
		is_playing: status.isPlaying ? 1 : 0,
		is_blacked_out: status.isBlackedOut ? 1 : 0,
		is_transitioning: status.isTransitioning ? 1 : 0,
		is_muted: status.isMuted ? 1 : 0,
		is_ready_to_play: status.isReadyToPlay ? 1 : 0,
		master_volume: Math.round((status.masterVolume ?? 1) * 100),
		current_item_index: status.currentItemIndex ?? 0,
		current_clip_name: currentClipName(status),
		current_playlist_name: status.currentPlaylist?.name ?? '',
		current_time: formatTime(status.currentTime),
		duration: formatTime(status.duration),
		time_remaining: formatTime(status.timeRemaining),
		time_remaining_seconds: status.timeRemaining ?? 0,
		active_channel: status.activeChannel ?? '',
	}
}

module.exports = function UpdateVariableDefinitions(self) {
	self.setVariableDefinitions({
		is_playing: { name: 'Playing (0/1)' },
		is_blacked_out: { name: 'Blacked out (0/1)' },
		is_transitioning: { name: 'Transitioning (0/1)' },
		is_muted: { name: 'Muted (0/1)' },
		is_ready_to_play: { name: 'Ready to play (0/1)' },
		master_volume: { name: 'Master volume (0–100)' },
		current_item_index: { name: 'Current item index (0-based)' },
		current_clip_name: { name: 'Current clip filename' },
		current_playlist_name: { name: 'Current playlist name' },
		current_time: { name: 'Current time (mm:ss)' },
		duration: { name: 'Current item duration (mm:ss)' },
		time_remaining: { name: 'Time remaining (mm:ss)' },
		time_remaining_seconds: { name: 'Time remaining (raw seconds)' },
		active_channel: { name: 'Active channel (a/b)' },
	})
}

module.exports.buildVariableValues = buildVariableValues
module.exports.formatTime = formatTime
