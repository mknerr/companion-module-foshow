const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const UpdatePresets = require('./presets')
const { buildVariableValues } = require('./variables')
const { FoShowApi } = require('./api')

const MIN_POLL_INTERVAL = 100
const DEFAULT_POLL_INTERVAL = 250
const MAX_BACKOFF = 5000
const PLAYLIST_REFRESH_MS = 3000

class FoShowInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		/** @type {FoShowApi|null} */
		this.api = null
		/** Last good /status snapshot; null when disconnected. */
		this.lastStatus = null
		/** Last good /playlists list. */
		this.playlists = []
		this.lastPlaylistFetch = 0
		this.lastOptionsSignature = null

		this.pollTimer = null
		this.pollActive = false
		this.pollBackoff = DEFAULT_POLL_INTERVAL
		this.pollInterval = DEFAULT_POLL_INTERVAL

		// Tracks the last reported connection state so we don't spam updateStatus().
		this.connState = null
		this.connMessage = undefined
	}

	async init(config) {
		this.config = config

		// Register definitions once up front (dropdowns refresh later from polled state).
		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		this.updatePresets()
		this.setVariableValues(buildVariableValues(null))

		this.applyConfig()
	}

	async configUpdated(config) {
		this.config = config
		this.applyConfig()
	}

	async destroy() {
		this.stopPolling()
		this.api = null
		this.lastStatus = null
	}

	// --- Configuration ------------------------------------------------------

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'FoShow',
				value:
					'Controls the FoShow macOS playout app via its HTTP/JSON API. Provide the host and the API token from FoShow’s settings.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Host / IP',
				width: 6,
				regex: Regex.IP,
				tooltip: 'Address of the Mac running FoShow. Ignored when a Bonjour device is selected below.',
			},
			{
				type: 'number',
				id: 'port',
				label: 'Port',
				width: 3,
				default: 7878,
				min: 1,
				max: 65535,
			},
			{
				type: 'secret-text',
				id: 'token',
				label: 'API token',
				width: 9,
				tooltip: 'Bearer token from FoShow. Sent as Authorization: Bearer <token> on every request.',
			},
			{
				type: 'number',
				id: 'pollInterval',
				label: 'Poll interval (ms)',
				width: 3,
				default: DEFAULT_POLL_INTERVAL,
				min: MIN_POLL_INTERVAL,
				max: 10000,
				tooltip: 'How often to GET /status. Minimum 100ms.',
			},
			{
				type: 'bonjour-device',
				id: 'bonjour_device',
				label: 'Auto-discover (Bonjour)',
				width: 9,
				tooltip: 'Optionally pick a FoShow instance discovered on the LAN. Overrides Host/Port above.',
			},
		]
	}

	/** Resolve the effective host/port, honouring a Bonjour selection when present. */
	effectiveTarget() {
		const bonjour = this.config.bonjour_device
		if (typeof bonjour === 'string' && bonjour.includes(':')) {
			const idx = bonjour.lastIndexOf(':')
			return { host: bonjour.slice(0, idx), port: Number(bonjour.slice(idx + 1)) }
		}
		return { host: (this.config.host || '').trim(), port: Number(this.config.port) || 7878 }
	}

	/** (Re)build the API client from config and (re)start polling. */
	applyConfig() {
		this.stopPolling()

		const { host, port } = this.effectiveTarget()
		const token = this.config.token

		if (!host || !token) {
			this.api = null
			this.lastStatus = null
			this.setVariableValues(buildVariableValues(null))
			this.setConnectionStatus(InstanceStatus.BadConfig, 'Set the host and API token')
			return
		}

		this.pollInterval = Math.max(Number(this.config.pollInterval) || DEFAULT_POLL_INTERVAL, MIN_POLL_INTERVAL)
		const timeout = Math.min(MAX_BACKOFF, Math.max(2000, this.pollInterval * 4))
		this.api = new FoShowApi({ host, port, token, timeout })

		this.setConnectionStatus(InstanceStatus.Connecting)
		this.startPolling()
	}

	// --- Polling ------------------------------------------------------------

	startPolling() {
		this.stopPolling()
		this.pollActive = true
		this.pollBackoff = this.pollInterval
		this.scheduleNextPoll(0)
	}

	stopPolling() {
		this.pollActive = false
		if (this.pollTimer) {
			clearTimeout(this.pollTimer)
			this.pollTimer = null
		}
	}

	scheduleNextPoll(delay) {
		if (!this.pollActive) return
		if (this.pollTimer) clearTimeout(this.pollTimer)
		this.pollTimer = setTimeout(() => this.poll(), delay)
	}

	/** Run a poll soon (e.g. right after sending a command) for snappy feedback. */
	requestImmediatePoll() {
		if (!this.pollActive) return
		this.scheduleNextPoll(75)
	}

	async poll() {
		if (!this.pollActive || !this.api) return

		try {
			const status = await this.api.getStatus()
			await this.maybeRefreshPlaylists()
			this.onPollSuccess(status)
			this.pollBackoff = this.pollInterval
			this.scheduleNextPoll(this.pollInterval)
		} catch (err) {
			this.onPollFailure(err)
			this.pollBackoff = Math.min(this.pollBackoff * 2, MAX_BACKOFF)
			this.scheduleNextPoll(this.pollBackoff)
		}
	}

	/** Refresh the playlist list at most every PLAYLIST_REFRESH_MS; never fails the poll. */
	async maybeRefreshPlaylists() {
		const now = Date.now()
		if (this.playlists.length && now - this.lastPlaylistFetch < PLAYLIST_REFRESH_MS) return
		try {
			const data = await this.api.getPlaylists()
			// FoShow wraps the list as { playlists: [...] }; tolerate a bare array too.
			this.playlists = Array.isArray(data) ? data : (data?.playlists ?? [])
			this.lastPlaylistFetch = now
		} catch (err) {
			this.log('debug', `Playlist refresh failed: ${err.message}`)
		}
	}

	onPollSuccess(status) {
		this.lastStatus = status
		this.setConnectionStatus(InstanceStatus.Ok)
		this.setVariableValues(buildVariableValues(status))

		// Re-register actions/feedbacks only when the dropdown choices actually change.
		const signature = this.optionsSignature()
		if (signature !== this.lastOptionsSignature) {
			this.lastOptionsSignature = signature
			this.updateActions()
			this.updateFeedbacks()
		}

		this.checkFeedbacks('isPlaying', 'isBlackedOut', 'isTransitioning', 'isCurrentClip', 'isCurrentPlaylist')
	}

	onPollFailure(err) {
		this.lastStatus = null
		this.setVariableValues(buildVariableValues(null))
		this.handleApiError(err)
		this.checkFeedbacks('isPlaying', 'isBlackedOut', 'isTransitioning', 'isCurrentClip', 'isCurrentPlaylist')
	}

	/** Map an API error onto a Companion connection state. */
	handleApiError(err) {
		if (err && err.status === 401) {
			this.setConnectionStatus(InstanceStatus.BadConfig, 'Invalid API token (401)')
		} else {
			this.setConnectionStatus(InstanceStatus.ConnectionFailure, err?.message ?? 'Connection failed')
		}
	}

	setConnectionStatus(status, message) {
		if (this.connState === status && this.connMessage === message) return
		this.connState = status
		this.connMessage = message
		this.updateStatus(status, message)
	}

	/** Stable signature of everything that drives dynamic dropdown choices. */
	optionsSignature() {
		const items = (this.lastStatus?.currentPlaylist?.items ?? []).map((i) => `${i.order}:${i.fileName}`).join('|')
		const playlists = this.playlists.map((p) => `${p.id}:${p.name}`).join('|')
		return `${items}##${playlists}`
	}

	// --- Choice helpers (used by actions.js and feedbacks.js) ---------------

	getClipChoices() {
		const items = this.lastStatus?.currentPlaylist?.items ?? []
		if (!items.length) return [{ id: 0, label: '(no clips loaded)' }]
		return items.map((i) => ({
			id: i.order,
			label: `${String(i.order + 1).padStart(2, '0')} — ${i.fileName}`,
		}))
	}

	getPlaylistChoices() {
		if (!this.playlists.length) return [{ id: '', label: '(no playlists loaded)' }]
		return this.playlists.map((p) => ({ id: p.id, label: p.name || p.id }))
	}

	// --- Action execution ---------------------------------------------------

	/**
	 * Run an API call for an action, with shared error handling and a quick
	 * post-command refresh so button feedback updates immediately.
	 * @param {(api: FoShowApi) => Promise<any>} fn
	 */
	async doAction(fn) {
		if (!this.api) {
			this.log('warn', 'Action ignored — connection is not configured')
			return
		}
		try {
			await fn(this.api)
			this.requestImmediatePoll()
		} catch (err) {
			this.log('error', `Action failed: ${err.message}`)
			this.handleApiError(err)
		}
	}

	// --- Definition registration wrappers -----------------------------------

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}

	updatePresets() {
		UpdatePresets(this)
	}
}

runEntrypoint(FoShowInstance, UpgradeScripts)
