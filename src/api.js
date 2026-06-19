/**
 * Thin HTTP/JSON client for the FoShow control surface.
 *
 * Every request is sent to `http://<host>:<port>/api/v1` with a
 * `Authorization: Bearer <token>` header. The single `request()` helper injects
 * auth, applies a timeout, and turns non-2xx responses into typed errors so the
 * instance can map them onto Companion connection states.
 */

const API_PREFIX = '/api/v1'

/**
 * Error thrown for any non-successful FoShow response or transport failure.
 * `status` is the HTTP status code when one is available (0 for transport/timeout errors).
 */
class FoShowApiError extends Error {
	constructor(message, status = 0) {
		super(message)
		this.name = 'FoShowApiError'
		this.status = status
	}
}

class FoShowApi {
	/**
	 * @param {object} opts
	 * @param {string} opts.host - target host/IP
	 * @param {number} opts.port - target port
	 * @param {string} opts.token - bearer token
	 * @param {number} [opts.timeout] - per-request timeout in ms
	 */
	constructor({ host, port, token, timeout = 4000 }) {
		this.host = host
		this.port = port
		this.token = token
		this.timeout = timeout
		this.baseUrl = `http://${host}:${port}${API_PREFIX}`
	}

	/**
	 * Perform a single request against the FoShow API.
	 *
	 * @param {string} path - path below the API prefix, e.g. `/status`
	 * @param {object} [options]
	 * @param {string} [options.method] - HTTP method (default GET)
	 * @param {object} [options.body] - JSON body; when present sets the content-type
	 * @returns {Promise<any>} parsed JSON body, or null when the response is empty
	 */
	async request(path, { method = 'GET', body } = {}) {
		const url = `${this.baseUrl}${path}`
		const headers = { Authorization: `Bearer ${this.token}` }

		let payload
		if (body !== undefined) {
			headers['Content-Type'] = 'application/json'
			payload = JSON.stringify(body)
		}

		const controller = new AbortController()
		const timer = setTimeout(() => controller.abort(), this.timeout)

		let res
		try {
			res = await fetch(url, { method, headers, body: payload, signal: controller.signal })
		} catch (err) {
			if (err.name === 'AbortError') {
				throw new FoShowApiError(`Request to ${path} timed out after ${this.timeout}ms`, 0)
			}
			throw new FoShowApiError(`Network error talking to ${this.host}:${this.port} (${err.message})`, 0)
		} finally {
			clearTimeout(timer)
		}

		if (res.status === 401) {
			throw new FoShowApiError('Unauthorized — check the FoShow API token', 401)
		}
		if (!res.ok) {
			throw new FoShowApiError(`FoShow returned HTTP ${res.status} for ${method} ${path}`, res.status)
		}

		const text = await res.text()
		if (!text) return null
		try {
			return JSON.parse(text)
		} catch {
			throw new FoShowApiError(`Could not parse JSON from ${path}`, res.status)
		}
	}

	// --- Read endpoints -----------------------------------------------------

	/** GET /status — full state snapshot. */
	getStatus() {
		return this.request('/status')
	}

	/** GET /playlists — list of playlists (id, name, itemCount). */
	getPlaylists() {
		return this.request('/playlists')
	}

	// --- Transport actions --------------------------------------------------

	play() {
		return this.request('/play', { method: 'POST' })
	}

	pause() {
		return this.request('/pause', { method: 'POST' })
	}

	toggle() {
		return this.request('/toggle', { method: 'POST' })
	}

	next() {
		return this.request('/next', { method: 'POST' })
	}

	previous() {
		return this.request('/previous', { method: 'POST' })
	}

	/** POST /cue — cue item `index` (0-based) in the current playlist. */
	cue(index) {
		return this.request('/cue', { method: 'POST', body: { index } })
	}

	/** POST /seek — seek to `time` seconds in the current item. */
	seek(time) {
		return this.request('/seek', { method: 'POST', body: { time } })
	}

	/** POST /fadeToBlack — DSK fade out over `duration` seconds. */
	fadeToBlack(duration) {
		return this.request('/fadeToBlack', { method: 'POST', body: { duration } })
	}

	/** POST /clearBlack — fade back in over `duration` seconds. */
	clearBlack(duration) {
		return this.request('/clearBlack', { method: 'POST', body: { duration } })
	}

	/** POST /playlists/<uuid>/load — switch the current playlist. */
	loadPlaylist(uuid) {
		return this.request(`/playlists/${encodeURIComponent(uuid)}/load`, { method: 'POST' })
	}
}

module.exports = { FoShowApi, FoShowApiError }
