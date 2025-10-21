import {clearSession, loadSession, saveSession} from './sessionStorage'

beforeEach(() => {
	// Clear both session storage mechanisms between tests
	sessionStorage.clear()
	clearSession()
})

describe('sessionStorage', () => {
	describe('saveSession', () => {
		it('saves session to cookie', () => {
			const session = {
				endpoint: 'https://example.com',
				token: 'test-token',
				ttl: 3600,
				ip: '10.0.0.1'
			}

			saveSession(session)

			const loaded = loadSession()
			expect(loaded).toEqual(session)
		})

		it('handles save errors gracefully', () => {
			const cookieSetter = vi
				.spyOn(document, 'cookie', 'set')
				.mockImplementation(() => {
					throw new Error('Cookie set error')
				})

			expect(() =>
				saveSession({
					endpoint: 'https://example.com',
					token: 'test-token',
					ttl: null,
					ip: null
				})
			).not.toThrow()

			cookieSetter.mockRestore()
		})
	})

	describe('loadSession', () => {
		it('loads session from cookie when present', () => {
			const session = {
				endpoint: 'https://example.com',
				token: 'test-token',
				ttl: 3600,
				ip: '10.0.0.1'
			}

			saveSession(session)

			const loaded = loadSession()
			expect(loaded).toEqual(session)
		})

		it('falls back to sessionStorage when cookie missing', () => {
			const session = {
				endpoint: 'https://example.com',
				token: 'test-token',
				ttl: 3600,
				ip: '10.0.0.1'
			}

			sessionStorage.setItem('knocker_session', JSON.stringify(session))

			const loaded = loadSession()
			expect(loaded).toEqual(session)
		})

		it('returns null when no session exists', () => {
			const loaded = loadSession()
			expect(loaded).toBeNull()
		})

		it('loads from sessionStorage when document is undefined (SSR-like)', () => {
			const session = {
				endpoint: 'https://example.com',
				token: 'test-token',
				ttl: 3600,
				ip: '10.0.0.1'
			}

			const originalDoc = globalThis.document
			try {
				vi.stubGlobal('document', undefined)
				sessionStorage.setItem('knocker_session', JSON.stringify(session))
				const loaded = loadSession()
				expect(loaded).toEqual(session)
			} finally {
				vi.stubGlobal('document', originalDoc)
			}
		})

		it('returns null when both document and sessionStorage are undefined', () => {
			const originalDoc = globalThis.document
			const originalSS = globalThis.sessionStorage
			try {
				vi.stubGlobal('document', undefined)
				vi.stubGlobal('sessionStorage', undefined)
				const loaded = loadSession()
				expect(loaded).toBeNull()
			} finally {
				vi.stubGlobal('document', originalDoc)
				vi.stubGlobal('sessionStorage', originalSS)
			}
		})

		it('handles parse errors gracefully (cookie)', () => {
			// Simulate invalid cookie via setter throwing invalid data on read
			const getSpy = vi
				.spyOn(document, 'cookie', 'get')
				.mockReturnValue('knocker_session=invalid%json')

			const loaded = loadSession()
			expect(loaded).toBeNull()

			getSpy.mockRestore()
		})

		it('handles getItem errors gracefully (sessionStorage fallback)', () => {
			const getItemSpy = vi
				.spyOn(sessionStorage, 'getItem')
				.mockImplementation(() => {
					throw new Error('Storage error')
				})

			const loaded = loadSession()
			expect(loaded).toBeNull()

			getItemSpy.mockRestore()
		})
	})

	describe('clearSession', () => {
		it('removes session from both cookie and sessionStorage', () => {
			const session = {
				endpoint: 'https://example.com',
				token: 'test-token',
				ttl: 3600,
				ip: '10.0.0.1'
			}

			// Seed both storage mechanisms
			sessionStorage.setItem('knocker_session', JSON.stringify(session))
			saveSession(session)

			clearSession()

			expect(sessionStorage.getItem('knocker_session')).toBeNull()
			expect(loadSession()).toBeNull()
		})

		it('handles clear errors gracefully', () => {
			const removeItemSpy = vi
				.spyOn(sessionStorage, 'removeItem')
				.mockImplementation(() => {
					throw new Error('Storage error')
				})

			expect(() => clearSession()).not.toThrow()

			removeItemSpy.mockRestore()
		})
	})
})
