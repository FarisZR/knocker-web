import {HttpResponse, http} from 'msw'
import {server} from '../mocks/server'
import {knock} from './knocker'

describe('knock', () => {
	it('sends knock request with all parameters', async () => {
		const result = await knock('https://example.com', 'admin-token-456', {
			ip_address: '10.0.0.1',
			ttl: 1800
		})

		expect(result.whitelisted_entry).toBe('10.0.0.1')
		expect(result.expires_in_seconds).toBe(1800)
	})

	it('sends knock request without optional parameters', async () => {
		const result = await knock('https://example.com', 'test-token-123', {})

		expect(result.whitelisted_entry).toBe('192.168.1.100')
	})

	it('appends /knock to endpoint if not present', async () => {
		const result = await knock('https://example.com', 'test-token-123')

		expect(result).toBeDefined()
	})

	it('uses endpoint as-is if it already ends with /knock', async () => {
		const result = await knock('https://example.com/knock', 'test-token-123')

		expect(result).toBeDefined()
	})

	it('throws error on 401 response', async () => {
		server.use(
			http.post('*/knock', () =>
				HttpResponse.json({error: 'Invalid API key'}, {status: 401})
			)
		)

		await expect(knock('https://example.com', 'bad-token')).rejects.toThrow(
			'Invalid API key'
		)
	})

	it('throws error on 403 response', async () => {
		server.use(
			http.post('*/knock', () =>
				HttpResponse.json({error: 'Insufficient permissions'}, {status: 403})
			)
		)

		await expect(
			knock('https://example.com', 'test-token-123')
		).rejects.toThrow('Insufficient permissions')
	})

	it('throws error with status text if error response is not JSON', async () => {
		server.use(
			http.post(
				'*/knock',
				() => new HttpResponse('Internal Server Error', {status: 500})
			)
		)

		await expect(
			knock('https://example.com', 'test-token-123')
		).rejects.toThrow('HTTP 500')
	})

	it('throws error with status text if error JSON is invalid', async () => {
		server.use(
			http.post('*/knock', () =>
				HttpResponse.json({invalid: 'structure'}, {status: 400})
			)
		)

		await expect(
			knock('https://example.com', 'test-token-123')
		).rejects.toThrow('HTTP 400')
	})
})
