export interface KnockerSession {
	endpoint: string
	token: string
	ttl: number | null
	ip: string | null
}

const STORAGE_KEY = 'knocker_session'

function setCookie(name: string, value: string, days: number) {
	const expires = new Date(
		Date.now() + days * 24 * 60 * 60 * 1000
	).toUTCString()
	// biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API not yet widely supported; string assignment is intentional
	document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
	const match = document.cookie.split('; ').find(c => c.startsWith(`${name}=`))
	if (!match) return null
	return match.split('=').slice(1).join('=')
}

export function saveSession(session: KnockerSession): void {
	try {
		const json = JSON.stringify(session)
		// Persist for 10 years
		setCookie(STORAGE_KEY, json, 3650)
		// biome-ignore lint/suspicious/noEmptyBlockStatements: Intentionally empty - graceful degradation
	} catch {}
}

export function loadSession(): KnockerSession | null {
	try {
		const cookieValue =
			typeof document !== 'undefined' ? getCookie(STORAGE_KEY) : null
		if (cookieValue) {
			const decoded = decodeURIComponent(cookieValue)
			return JSON.parse(decoded) as KnockerSession
		}
		// Fallback to sessionStorage for compatibility in older versions/tests
		if (typeof sessionStorage !== 'undefined') {
			const data = sessionStorage.getItem(STORAGE_KEY)
			if (!data) return null
			return JSON.parse(data) as KnockerSession
		}
		return null
	} catch {
		// Gracefully handle parse errors
		return null
	}
}

export function clearSession(): void {
	try {
		// Delete cookie by setting expiration in past
		if (typeof document !== 'undefined') {
			// biome-ignore lint/suspicious/noDocumentCookie: Intentional cookie clearing for compatibility
			document.cookie = `${STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
		}
		// Also remove sessionStorage fallback
		try {
			sessionStorage.removeItem(STORAGE_KEY)
		} catch {
			// intentionally swallow storage errors (graceful degradation)
		}
		// biome-ignore lint/suspicious/noEmptyBlockStatements: Intentionally empty - graceful degradation
	} catch {}
}
