export const AUTO_KNOCK_COOKIE = 'knocker_auto_knock'

export function setCookie(name: string, value: string, days: number): void {
	const expires = new Date()
	expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
	document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

export function getCookie(name: string): string | null {
	const match = document.cookie.split('; ').find(row => row.startsWith(name + '='))
	if (!match) return null
	return decodeURIComponent(match.split('=')[1])
}

export function deleteCookie(name: string): void {
	document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`
}

export function setAutoKnock(enabled: boolean): void {
	// Persist explicit enabled/disabled state as '1'/'0' so tests can check
	// presence/absence of the "1" value reliably.
	setCookie(AUTO_KNOCK_COOKIE, enabled ? '1' : '0', 365)
}

export function getAutoKnock(): boolean {
	const v = getCookie(AUTO_KNOCK_COOKIE)
	return v === '1'
}

export function clearAutoKnock(): void {
	deleteCookie(AUTO_KNOCK_COOKIE)
}