import {HttpResponse, http} from 'msw'

const VALID_TOKEN = 'test-token-123'
const ADMIN_TOKEN = 'admin-token-456'
const MAX_TTL = 3600 // 1 hour

export const handlers = [
	http.post('*/knock', async ({request}) => {
		const apiKey = request.headers.get('X-Api-Key')

		// Check authentication
		if (!apiKey) {
			return HttpResponse.json({error: 'Missing API key'}, {status: 401})
		}

		if (apiKey !== VALID_TOKEN && apiKey !== ADMIN_TOKEN) {
			return HttpResponse.json({error: 'Invalid API key'}, {status: 401})
		}

		// Parse request body
		// biome-ignore lint/style/useNamingConvention: API uses snake_case
		let body: {ip_address?: string; ttl?: number} = {}
		try {
			const text = await request.text()
			if (text) {
				body = JSON.parse(text)
			}
		} catch {
			return HttpResponse.json({error: 'Invalid JSON'}, {status: 400})
		}

		// Validate IP address permission
		if (body.ip_address && apiKey !== ADMIN_TOKEN) {
			return HttpResponse.json(
				{error: 'Insufficient permissions to whitelist remote IPs'},
				{status: 403}
			)
		}

		// Calculate TTL (cap at max)
		const requestedTTL = body.ttl || MAX_TTL
		const actualTTL = Math.min(requestedTTL, MAX_TTL)
		const now = Math.floor(Date.now() / 1000)

		return HttpResponse.json({
			// biome-ignore lint/style/useNamingConvention: API uses snake_case
			whitelisted_entry: body.ip_address || '192.168.1.100',
			// biome-ignore lint/style/useNamingConvention: API uses snake_case
			expires_at: now + actualTTL,
			// biome-ignore lint/style/useNamingConvention: API uses snake_case
			expires_in_seconds: actualTTL
		})
	})
]
