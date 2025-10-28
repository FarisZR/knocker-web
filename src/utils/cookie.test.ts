import {beforeEach, describe, expect, it} from 'vitest'
import {
	AUTO_KNOCK_COOKIE,
	clearAutoKnock,
	getAutoKnock,
	setAutoKnock
} from '@/utils/cookie'

beforeEach(() => {
	// Ensure a clean cookie state between tests
	document.cookie = `${AUTO_KNOCK_COOKIE}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
})

describe('cookie helper', () => {
	it('sets and reads enabled', () => {
		setAutoKnock(true)
		expect(getAutoKnock()).toBe(true)
		expect(document.cookie.includes(`${AUTO_KNOCK_COOKIE}=1`)).toBe(true)
	})

	it('sets and reads disabled', () => {
		setAutoKnock(false)
		expect(getAutoKnock()).toBe(false)
		expect(document.cookie.includes(`${AUTO_KNOCK_COOKIE}=0`)).toBe(true)
	})

	it('clearAutoKnock removes cookie', () => {
		setAutoKnock(true)
		clearAutoKnock()
		expect(getAutoKnock()).toBe(false)
		expect(document.cookie.includes(`${AUTO_KNOCK_COOKIE}=1`)).toBe(false)
	})
})
