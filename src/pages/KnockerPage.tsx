import {useMutation} from '@tanstack/react-query'
import {type FormEvent, useEffect, useId, useState} from 'react'
import {useSearchParams} from 'react-router'
import {type KnockResponse, knock} from '@/api/knocker'
import {Head} from '@/components/Head'
import {loadSession, saveSession} from '@/utils/sessionStorage'

export function KnockerPage() {
	const [searchParams] = useSearchParams()
	const [endpoint, setEndpoint] = useState('')
	const [token, setToken] = useState('')
	const [ttl, setTtl] = useState('')
	const [ip, setIp] = useState('')
	const [result, setResult] = useState<KnockResponse | null>(null)
	const [requestedTtl, setRequestedTtl] = useState<number | null>(null)

	// Generate unique IDs for form inputs
	const endpointId = useId()
	const tokenId = useId()
	const ttlId = useId()
	const ipId = useId()

	const knockMutation = useMutation({
		mutationFn: async () => {
			const ttlValue = ttl ? Number.parseInt(ttl, 10) : null
			const ipValue = ip.trim() || null

			setRequestedTtl(ttlValue)

			const response = await knock(endpoint, token, {
				ttl: ttlValue || undefined,
				// biome-ignore lint/style/useNamingConvention: API uses snake_case
				ip_address: ipValue || undefined
			})

			// Save to session storage on success
			saveSession({
				endpoint,
				token,
				ttl: ttlValue,
				ip: ipValue
			})

			return response
		},
		onSuccess: data => {
			setResult(data)
		},
		onError: () => {
			setResult(null)
		}
	})

	// Load session data on mount
	// Derive autoKnock from the URL so it can be a proper dependency
	const autoKnock = searchParams.get('autoKnock') === 'true'

	useEffect(() => {
		const session = loadSession()
		if (session) {
			setEndpoint(session.endpoint)
			setToken(session.token)
			setTtl(session.ttl ? String(session.ttl) : '')
			setIp(session.ip || '')

			// Auto-knock if query param is present
			if (autoKnock) {
				// Use setTimeout to ensure form is fully hydrated
				setTimeout(() => {
					knockMutation.mutate()
				}, 0)
			}
		}
	}, [autoKnock, knockMutation.mutate])

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()
		knockMutation.mutate()
	}

	const showTtlWarning =
		result && requestedTtl && result.expires_in_seconds < requestedTtl

	return (
		<>
			<Head title='Knocker Web' />
			<div className='flex min-h-screen items-center justify-center bg-white p-4 dark:bg-gray-900'>
				<div className='w-full max-w-md'>
					<h1 className='mb-8 text-center font-bold text-4xl text-gray-900 dark:text-white'>
						Knocker Web
					</h1>

					<form
						className='space-y-4 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800'
						onSubmit={handleSubmit}
					>
						<div>
							<label
								className='mb-2 block font-medium text-gray-900 text-sm dark:text-white'
								htmlFor={endpointId}
							>
								Knocker Endpoint URL *
							</label>
							<input
								className='w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#fde562] focus:outline-none focus:ring-2 focus:ring-[#fde562] dark:border-gray-600 dark:bg-gray-700 dark:text-white'
								id={endpointId}
								onChange={e => setEndpoint(e.target.value)}
								placeholder='https://knocker.example.com'
								required={true}
								type='url'
								value={endpoint}
							/>
						</div>

						<div>
							<label
								className='mb-2 block font-medium text-gray-900 text-sm dark:text-white'
								htmlFor={tokenId}
							>
								Token *
							</label>
							<input
								className='w-full rounded border border-gray-300 px-3 py-2 font-mono text-gray-900 text-sm focus:border-[#fde562] focus:outline-none focus:ring-2 focus:ring-[#fde562] dark:border-gray-600 dark:bg-gray-700 dark:text-white'
								id={tokenId}
								onChange={e => setToken(e.target.value)}
								placeholder='your-api-token'
								required={true}
								type='password'
								value={token}
							/>
						</div>

						<div>
							<label
								className='mb-2 block font-medium text-gray-900 text-sm dark:text-white'
								htmlFor={ttlId}
							>
								TTL (seconds)
							</label>
							<input
								className='w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#fde562] focus:outline-none focus:ring-2 focus:ring-[#fde562] dark:border-gray-600 dark:bg-gray-700 dark:text-white'
								id={ttlId}
								min='1'
								onChange={e => setTtl(e.target.value)}
								placeholder='3600'
								type='number'
								value={ttl}
							/>
						</div>

						<div>
							<label
								className='mb-2 block font-medium text-gray-900 text-sm dark:text-white'
								htmlFor={ipId}
							>
								IP/CIDR to whitelist (optional)
							</label>
							<input
								className='w-full rounded border border-gray-300 px-3 py-2 font-mono text-gray-900 text-sm focus:border-[#fde562] focus:outline-none focus:ring-2 focus:ring-[#fde562] dark:border-gray-600 dark:bg-gray-700 dark:text-white'
								id={ipId}
								onChange={e => setIp(e.target.value)}
								placeholder='192.168.1.0/24'
								type='text'
								value={ip}
							/>
							<p className='mt-1 text-gray-500 text-xs dark:text-gray-400'>
								Leave empty to whitelist your current IP
							</p>
						</div>

						<button
							className='w-full rounded bg-[#fde562] px-4 py-2 font-semibold text-gray-900 transition-colors hover:bg-[#fcd645] focus:outline-none focus:ring-2 focus:ring-[#fde562] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800'
							disabled={knockMutation.isPending}
							type='submit'
						>
							{knockMutation.isPending ? 'Knocking...' : 'Knock'}
						</button>
					</form>

					{/* Success message */}
					{knockMutation.isSuccess && result && (
						<div className='mt-6 rounded-lg border-2 border-green-500 bg-green-50 p-4 dark:bg-green-900/20'>
							<div className='flex items-center'>
								<svg
									aria-label='Success checkmark'
									className='mr-2 h-6 w-6 text-green-500'
									fill='none'
									role='img'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										d='M5 13l4 4L19 7'
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
									/>
								</svg>
								<h3 className='font-semibold text-green-800 dark:text-green-200'>
									Success!
								</h3>
							</div>
							<div className='mt-2 text-green-700 text-sm dark:text-green-300'>
								<p>
									<strong>Whitelisted:</strong>{' '}
									<code className='rounded bg-green-100 px-1 py-0.5 dark:bg-green-800'>
										{result.whitelisted_entry}
									</code>
								</p>
								<p className='mt-1'>
									<strong>Expires in:</strong> {result.expires_in_seconds}{' '}
									seconds
								</p>
								<p className='mt-1 text-xs'>
									<strong>Expires at:</strong>{' '}
									{new Date(result.expires_at * 1000).toLocaleString()}
								</p>
							</div>

							{/* TTL warning */}
							{showTtlWarning && (
								<div className='mt-3 rounded border border-yellow-400 bg-yellow-50 p-2 dark:bg-yellow-900/20'>
									<p className='text-xs text-yellow-800 dark:text-yellow-200'>
										⚠️ TTL was capped by the server. Requested: {requestedTtl}s,
										Applied: {result.expires_in_seconds}s
									</p>
								</div>
							)}
						</div>
					)}

					{/* Error message */}
					{knockMutation.isError && (
						<div className='mt-6 rounded-lg border-2 border-red-500 bg-red-50 p-4 dark:bg-red-900/20'>
							<div className='flex items-center'>
								<svg
									aria-label='Error X mark'
									className='mr-2 h-6 w-6 text-red-500'
									fill='none'
									role='img'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										d='M6 18L18 6M6 6l12 12'
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
									/>
								</svg>
								<h3 className='font-semibold text-red-800 dark:text-red-200'>
									Error
								</h3>
							</div>
							<p className='mt-2 text-red-700 text-sm dark:text-red-300'>
								{knockMutation.error?.message || 'Failed to knock'}
							</p>
						</div>
					)}
				</div>
			</div>
		</>
	)
}
