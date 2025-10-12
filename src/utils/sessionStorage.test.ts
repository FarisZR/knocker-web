import {clearSession, loadSession, saveSession} from './sessionStorage'

beforeEach(() => {
	sessionStorage.clear()
})

describe('sessionStorage', () => {
	describe('saveSession', () => {
		it('saves session to sessionStorage', () => {
			const session = {
				endpoint: 'https://example.com',
				token: 'test-token',
				ttl: 3600,
				ip: '10.0.0.1'
			}

			saveSession(session)

			const stored = sessionStorage.getItem('knocker_session')
			expect(stored).toBe(JSON.stringify(session))
		})

		it('handles save errors gracefully', () => {
			const setItemSpy = vi
				.spyOn(sessionStorage, 'setItem')
				.mockImplementation(() => {
					throw new Error('Storage error')
				})

			expect(() =>
				saveSession({
					endpoint: 'https://example.com',
					token: 'test-token',
					ttl: null,
					ip: null
				})
			).not.toThrow()

			setItemSpy.mockRestore()
		})
	})

	describe('loadSession', () => {
		it('loads session from sessionStorage', () => {
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

		it('handles parse errors gracefully', () => {
			sessionStorage.setItem('knocker_session', 'invalid json')

			const loaded = loadSession()
			expect(loaded).toBeNull()
		})

		it('handles getItem errors gracefully', () => {
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
		it('removes session from sessionStorage', () => {
			const session = {
				endpoint: 'https://example.com',
				token: 'test-token',
				ttl: 3600,
				ip: '10.0.0.1'
			}

			sessionStorage.setItem('knocker_session', JSON.stringify(session))

			clearSession()

			const stored = sessionStorage.getItem('knocker_session')
			expect(stored).toBeNull()
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
