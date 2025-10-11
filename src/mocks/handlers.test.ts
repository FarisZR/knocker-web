describe('handlers', () => {
	it('rejects knock without API key', async () => {
		const response = await fetch('https://example.com/knock', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: '{}'
		})

		expect(response.status).toBe(401)
		const data = await response.json()
		expect(data.error).toBe('Missing API key')
	})

	it('rejects knock with invalid API key', async () => {
		const response = await fetch('https://example.com/knock', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': 'invalid-key'
			},
			body: '{}'
		})

		expect(response.status).toBe(401)
		const data = await response.json()
		expect(data.error).toBe('Invalid API key')
	})

	it('rejects invalid JSON in request body', async () => {
		const response = await fetch('https://example.com/knock', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': 'test-token-123'
			},
			body: 'invalid json'
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toBe('Invalid JSON')
	})

	it('rejects remote IP whitelisting without admin token', async () => {
		const response = await fetch('https://example.com/knock', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': 'test-token-123'
			},
			body: JSON.stringify({ip_address: '10.0.0.1'})
		})

		expect(response.status).toBe(403)
		const data = await response.json()
		expect(data.error).toContain('Insufficient permissions')
	})

	it('allows remote IP whitelisting with admin token', async () => {
		const response = await fetch('https://example.com/knock', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': 'admin-token-456'
			},
			body: JSON.stringify({ip_address: '10.0.0.1'})
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.whitelisted_entry).toBe('10.0.0.1')
	})

	it('caps TTL at maximum', async () => {
		const response = await fetch('https://example.com/knock', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': 'test-token-123'
			},
			body: JSON.stringify({ttl: 7200})
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.expires_in_seconds).toBe(3600) // Capped at max
	})

	it('uses default TTL when not specified', async () => {
		const response = await fetch('https://example.com/knock', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': 'test-token-123'
			},
			body: '{}'
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.expires_in_seconds).toBe(3600) // Default max
	})

	it('uses empty object when body is empty', async () => {
		const response = await fetch('https://example.com/knock', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': 'test-token-123'
			},
			body: ''
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.whitelisted_entry).toBe('192.168.1.100')
	})
})
