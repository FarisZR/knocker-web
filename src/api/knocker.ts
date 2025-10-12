import * as v from 'valibot'

// Regex for URL cleaning (at top level for performance)
const TRAILING_SLASH_REGEX = /\/$/

// Request schema
// Note: snake_case properties match the API specification
export const KnockRequest = v.object({
	// biome-ignore lint/style/useNamingConvention: API uses snake_case
	ip_address: v.nullish(v.string()),
	ttl: v.nullish(v.pipe(v.number(), v.integer(), v.minValue(1)))
})
export type KnockRequest = v.InferOutput<typeof KnockRequest>

// Response schemas
// Note: snake_case properties match the API specification
export const KnockResponse = v.object({
	// biome-ignore lint/style/useNamingConvention: API uses snake_case
	whitelisted_entry: v.string(),
	// biome-ignore lint/style/useNamingConvention: API uses snake_case
	expires_at: v.number(),
	// biome-ignore lint/style/useNamingConvention: API uses snake_case
	expires_in_seconds: v.number()
})
export type KnockResponse = v.InferOutput<typeof KnockResponse>

export const ErrorResponse = v.object({
	error: v.string()
})
export type ErrorResponse = v.InferOutput<typeof ErrorResponse>

// Knock function
export async function knock(
	endpoint: string,
	token: string,
	request: KnockRequest = {}
): Promise<KnockResponse> {
	const url = endpoint.endsWith('/knock')
		? endpoint
		: `${endpoint.replace(TRAILING_SLASH_REGEX, '')}/knock`

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Api-Key': token
		},
		body: JSON.stringify(request)
	})

	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`
		try {
			const errorData = await response.json()
			const parsed = v.safeParse(ErrorResponse, errorData)
			if (parsed.success) {
				errorMessage = parsed.output.error
			}
		} catch {
			// If parsing fails, use the default error message
		}
		throw new Error(errorMessage)
	}

	const data = await response.json()
	return v.parse(KnockResponse, data)
}
