import {HttpResponse, http} from 'msw'
import {vi} from 'vitest'
import {server} from '../mocks/server'
import {queryClient, render, screen, waitFor} from '../test-utils'
import {clearSession, loadSession, saveSession} from '../utils/sessionStorage'
import {KnockerPage} from './KnockerPage'

beforeEach(() => {
	sessionStorage.clear()
	queryClient.clear()
	clearSession()
})

describe('KnockerPage', () => {
	it('renders form with required inputs', () => {
		render(<KnockerPage />)

		expect(screen.getByLabelText(/endpoint url/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/token/i)).toBeInTheDocument()
		expect(screen.getByRole('button', {name: /knock/i})).toBeInTheDocument()
	})

	it('renders optional inputs', () => {
		render(<KnockerPage />)

		expect(screen.getByLabelText(/ttl/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/ip.*cidr/i)).toBeInTheDocument()
	})

	it('successfully knocks with valid credentials', async () => {
		const {user} = render(<KnockerPage />)

		const endpointInput = screen.getByLabelText(/endpoint url/i)
		const tokenInput = screen.getByLabelText(/token/i)
		const knockButton = screen.getByRole('button', {name: /knock/i})

		await user.type(endpointInput, 'https://example.com')
		await user.type(tokenInput, 'test-token-123')
		await user.click(knockButton)

		await waitFor(() => {
			expect(screen.getByText(/success/i)).toBeInTheDocument()
		})

		expect(screen.getByText(/192\.168\.1\.100/)).toBeInTheDocument()
	})

	it('shows error message on failed knock', async () => {
		server.use(
			http.post('*/knock', () =>
				HttpResponse.json({error: 'Invalid API key'}, {status: 401})
			)
		)

		const {user} = render(<KnockerPage />)

		await user.type(
			screen.getByLabelText(/endpoint url/i),
			'https://example.com'
		)
		await user.type(screen.getByLabelText(/token/i), 'invalid-token')
		await user.click(screen.getByRole('button', {name: /knock/i}))

		await waitFor(() => {
			expect(screen.getByText(/invalid api key/i)).toBeInTheDocument()
		})
	})

	it('saves inputs to cookie on successful knock', async () => {
		const {user} = render(<KnockerPage />)

		await user.type(
			screen.getByLabelText(/endpoint url/i),
			'https://example.com'
		)
		await user.type(screen.getByLabelText(/token/i), 'test-token-123')
		await user.type(screen.getByLabelText(/ttl/i), '1800')
		await user.click(screen.getByRole('button', {name: /knock/i}))

		await waitFor(() => {
			expect(screen.getByText(/success/i)).toBeInTheDocument()
		})

		const session = loadSession()
		expect(session?.endpoint).toBe('https://example.com')
		expect(session?.token).toBe('test-token-123')
		expect(session?.ttl).toBe(1800)
	})

	it('loads inputs from session on mount', () => {
		saveSession({
			endpoint: 'https://saved.com',
			token: 'saved-token',
			ttl: 7200,
			ip: '10.0.0.1'
		})

		render(<KnockerPage />)

		expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
			'https://saved.com'
		)
		expect(screen.getByLabelText(/token/i)).toHaveValue('saved-token')
		expect(screen.getByLabelText(/ttl/i)).toHaveValue(7200)
		expect(screen.getByLabelText(/ip.*cidr/i)).toHaveValue('10.0.0.1')
	})

	it('automatically knocks on mount when autoKnock query param is present', async () => {
		saveSession({
			endpoint: 'https://example.com',
			token: 'test-token-123',
			ttl: null,
			ip: null
		})

		// Use cookie-based auto-knock in tests
		// biome-ignore lint/suspicious/noDocumentCookie: Direct cookie manipulation is needed for test setup
		document.cookie = 'knocker_auto_knock=1'
		render(<KnockerPage />)

		await waitFor(() => {
			expect(screen.getByText(/success/i)).toBeInTheDocument()
		})
	})

	it('shows warning when TTL is capped by server', async () => {
		server.use(
			http.post('*/knock', async ({request}) => {
				const body = (await request.json()) as {ttl?: number}
				const requestedTTL = body.ttl || 3600
				const actualTTL = Math.min(requestedTTL, 3600)
				const now = Math.floor(Date.now() / 1000)

				return HttpResponse.json({
					whitelisted_entry: '192.168.1.100',
					expires_at: now + actualTTL,
					expires_in_seconds: actualTTL
				})
			})
		)

		const {user} = render(<KnockerPage />)

		await user.type(
			screen.getByLabelText(/endpoint url/i),
			'https://example.com'
		)
		await user.type(screen.getByLabelText(/token/i), 'test-token-123')
		await user.type(screen.getByLabelText(/ttl/i), '7200') // Request 2 hours
		await user.click(screen.getByRole('button', {name: /knock/i}))

		await waitFor(() => {
			expect(screen.getByText(/ttl.*capped/i)).toBeInTheDocument()
		})
	})

	it('toggles auto-knock query parameter when switch is clicked', async () => {
		saveSession({
			endpoint: 'https://example.com',
			token: 'test-token-123',
			ttl: null,
			ip: null
		})

		// Use cookie-based auto-knock in tests
		// biome-ignore lint/suspicious/noDocumentCookie: Direct cookie manipulation is needed for test setup
		document.cookie = 'knocker_auto_knock=1'
		const {user} = render(<KnockerPage />)

		const toggle = await screen.findByRole('switch', {
			name: /auto-knock on page load/i
		})

		// Cookie should be set initially
		expect(document.cookie.includes('knocker_auto_knock=1')).toBe(true)
		await user.click(toggle)
		// Toggle should set cookie value to '0' when disabled
		expect(document.cookie.includes('knocker_auto_knock=0')).toBe(true)

		await user.click(toggle)
		expect(document.cookie.includes('knocker_auto_knock=1')).toBe(true)
	})

	it('shows friendly network error message when fetch fails', async () => {
		const originalFetch = globalThis.fetch
		globalThis.fetch = vi.fn(() =>
			Promise.reject(new TypeError('Failed to fetch'))
		) as unknown as typeof fetch

		try {
			const {user} = render(<KnockerPage />)

			await user.type(
				screen.getByLabelText(/endpoint url/i),
				'https://example.com'
			)
			await user.type(screen.getByLabelText(/token/i), 'test-token-123')
			await user.click(screen.getByRole('button', {name: /knock/i}))

			await waitFor(() => {
				expect(screen.getByText(/failed to reach knocker/i)).toBeInTheDocument()
			})
		} finally {
			globalThis.fetch = originalFetch
		}
	})

	it('validates required fields', async () => {
		const {user} = render(<KnockerPage />)

		await user.click(screen.getByRole('button', {name: /knock/i}))

		// HTML5 validation should prevent submission
		const endpointInput = screen.getByLabelText(/endpoint url/i)
		expect(endpointInput).toBeInvalid()
	})
})
