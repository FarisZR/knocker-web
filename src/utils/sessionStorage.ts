export interface KnockerSession {
	endpoint: string
	token: string
	ttl: number | null
	ip: string | null
}

const STORAGE_KEY = 'knocker_session'

export function saveSession(session: KnockerSession): void {
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
		// biome-ignore lint/suspicious/noEmptyBlockStatements: Intentionally empty - graceful degradation
	} catch {}
}

export function loadSession(): KnockerSession | null {
	try {
		const data = sessionStorage.getItem(STORAGE_KEY)
		if (!data) return null
		return JSON.parse(data) as KnockerSession
	} catch {
		// Gracefully handle parse errors
		return null
	}
}

export function clearSession(): void {
	try {
		sessionStorage.removeItem(STORAGE_KEY)
		// biome-ignore lint/suspicious/noEmptyBlockStatements: Intentionally empty - graceful degradation
	} catch {}
}
