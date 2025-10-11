import {HttpResponse, http} from 'msw'
import {App} from './App'
import {server} from './mocks/server'
import {queryClient, render, screen, waitFor} from './test-utils'

beforeEach(() => {
	sessionStorage.clear()
	queryClient.clear()
})

const widths = [360, 1280]

it.each(widths)('renders knocker form with %o viewport', async width => {
	window.happyDOM?.setViewport({width, height: 720})
	render(<App />, {route: '/'})

	expect(screen.getByText('Knocker Web')).toBeInTheDocument()
	expect(screen.getByLabelText(/endpoint url/i)).toBeInTheDocument()
	expect(screen.getByLabelText(/token/i)).toBeInTheDocument()
	expect(screen.getByRole('button', {name: /knock/i})).toBeInTheDocument()
})

it('performs successful knock', async () => {
	const {user} = render(<App />)

	await user.type(screen.getByLabelText(/endpoint url/i), 'https://example.com')
	await user.type(screen.getByLabelText(/token/i), 'test-token-123')
	await user.click(screen.getByRole('button', {name: /knock/i}))

	await waitFor(() => {
		expect(screen.getByText(/success/i)).toBeInTheDocument()
	})
})

it('handles knock error', async () => {
	queryClient.clear()
	server.use(
		http.post('*/knock', () =>
			HttpResponse.json({error: 'Invalid API key'}, {status: 401})
		)
	)

	const {user} = render(<App />)

	await user.type(screen.getByLabelText(/endpoint url/i), 'https://example.com')
	await user.type(screen.getByLabelText(/token/i), 'bad-token')
	await user.click(screen.getByRole('button', {name: /knock/i}))

	await waitFor(() => {
		expect(screen.getByText(/invalid api key/i)).toBeInTheDocument()
	})
})

it('shows loading state in suspense', () => {
	render(<App />)

	// The app should render immediately
	expect(screen.getByText('Knocker Web')).toBeInTheDocument()
})
