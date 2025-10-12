import {HttpResponse, http} from 'msw'

const VALID_TOKEN = 'test-token-123'
const ADMIN_TOKEN = 'admin-token-456'
const MAX_TTL = 3600 // 1 hour

const isRunningTests = import.meta.env.MODE === 'test'
const isStrictMockMode =
	import.meta.env.VITE_MSW_STRICT === 'true' || isRunningTests

// Helper to validate API key
function validateApiKey(apiKey: string | null) {
	if (!apiKey) {
		return HttpResponse.json({error: 'Missing API key'}, {status: 401})
	}

	// In the browser (dev) MSW worker, accept any non-empty token so
	// developers can use real tokens during local development. In node
	// (tests) keep the strict token validation.
	if (typeof window === 'undefined' || isStrictMockMode) {
		// Node environment - used by tests
		if (apiKey !== VALID_TOKEN && apiKey !== ADMIN_TOKEN) {
			return HttpResponse.json({error: 'Invalid API key'}, {status: 401})
		}
	} else if (apiKey === '') {
		// Browser environment - allow any non-empty token
		return HttpResponse.json({error: 'Invalid API key'}, {status: 401})
	}

	return null
}

// Helper to parse request body
async function parseRequestBody(request: Request) {
	// biome-ignore lint/style/useNamingConvention: API uses snake_case
	let body: {ip_address?: string; ttl?: number} = {}
	try {
		const text = await request.text()
		if (text) {
			body = JSON.parse(text)
		}
		return {body, error: null}
	} catch {
		return {
			body: null,
			error: HttpResponse.json({error: 'Invalid JSON'}, {status: 400})
		}
	}
}

// Helper to calculate TTL
function calculateTTL(requestedTTL: number | undefined) {
	const parsedTTL =
		typeof requestedTTL === 'number' && Number.isFinite(requestedTTL)
			? Math.floor(requestedTTL)
			: undefined
	const ttl = parsedTTL ?? MAX_TTL
	const safeTTL = Math.max(1, ttl)
	return Math.min(safeTTL, MAX_TTL)
}

export const handlers = [
	http.post('*/knock', async ({request}) => {
		const apiKey = request.headers.get('X-Api-Key')

		// Check authentication
		const authError = validateApiKey(apiKey)
		if (authError) {
			return authError
		}

		// Parse request body
		const {body, error} = await parseRequestBody(request)
		if (error) {
			return error
		}

		// Validate IP address permission
		if (body?.ip_address && apiKey !== ADMIN_TOKEN) {
			return HttpResponse.json(
				{error: 'Insufficient permissions to whitelist remote IPs'},
				{status: 403}
			)
		}

		// Calculate TTL (cap at max)
		const actualTTL = calculateTTL(body?.ttl)
		const now = Math.floor(Date.now() / 1000)

		return HttpResponse.json({
			// biome-ignore lint/style/useNamingConvention: API uses snake_case
			whitelisted_entry: body?.ip_address || '192.168.1.100',
			// biome-ignore lint/style/useNamingConvention: API uses snake_case
			expires_at: now + actualTTL,
			// biome-ignore lint/style/useNamingConvention: API uses snake_case
			expires_in_seconds: actualTTL
		})
	})
]
