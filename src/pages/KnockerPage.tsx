import {useMutation} from '@tanstack/react-query'
import {type FormEvent, useEffect, useId, useState} from 'react'
import {useSearchParams} from 'react-router'
import {type KnockResponse, knock} from '@/api/knocker'
import {Head} from '@/components/Head'
import {loadSession, saveSession} from '@/utils/sessionStorage'

export function KnockerPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [endpoint, setEndpoint] = useState('')
	const [token, setToken] = useState('')
	const [ttl, setTtl] = useState('')
	const [ip, setIp] = useState('')
	const [result, setResult] = useState<KnockResponse | null>(null)
	const [requestedTtl, setRequestedTtl] = useState<number | null>(null)
	const [enableAutoKnock, setEnableAutoKnock] = useState(false)

	// Generate unique IDs for form inputs
	const endpointId = useId()
	const tokenId = useId()
	const ttlId = useId()
	const ipId = useId()
	const autoKnockToggleId = useId()

	const knockMutation = useMutation({
		mutationFn: async () => {
			const ttlValue = ttl ? Number.parseInt(ttl, 10) : null
			const ipValue = ip.trim() || null

			setRequestedTtl(ttlValue)

			try {
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
			} catch (error) {
				// Improve error message for network failures
				if (error instanceof TypeError && error.message === 'Failed to fetch') {
					throw new Error(
						'Failed to reach Knocker. Are you sure Knocker is running?'
					)
				}
				throw error
			}
		},
		onSuccess: data => {
			setResult(data)
		},
		onError: () => {
			setResult(null)
		}
	})

	// Load session data on mount
	useEffect(() => {
		const session = loadSession()
		if (session) {
			setEndpoint(session.endpoint)
			setToken(session.token)
			setTtl(session.ttl ? String(session.ttl) : '')
			setIp(session.ip || '')
			setEnableAutoKnock(session.endpoint !== '' && session.token !== '')
		}
	}, [])

	// Auto-knock when enabled and data is loaded
	useEffect(() => {
		const shouldAutoKnock = searchParams.get('autoKnock') === 'true'
		if (
			shouldAutoKnock &&
			enableAutoKnock &&
			endpoint &&
			token &&
			!knockMutation.isPending &&
			!result
		) {
			// Small delay to ensure form is fully hydrated
			const timer = setTimeout(() => {
				knockMutation.mutate()
			}, 100)
			return () => clearTimeout(timer)
		}
		return
	}, [enableAutoKnock, endpoint, token, searchParams, knockMutation, result])

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()
		knockMutation.mutate()
	}

	const showTtlWarning =
		result && requestedTtl && result.expires_in_seconds < requestedTtl

	const handleAutoKnockToggle = () => {
		const newValue = !enableAutoKnock
		setEnableAutoKnock(newValue)

		// Update URL params
		if (newValue) {
			setSearchParams({autoKnock: 'true'})
		} else {
			setSearchParams({})
		}
	}

	return (
		<>
			<Head title='Knocker Web' />
			<div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-950'>
				<div className='w-full max-w-md'>
					<h1 className='sr-only'>Knocker Web</h1>
					<div className='mb-6 flex items-center justify-center space-x-3'>
						<img
							alt='Knocker icon'
							className='h-8'
							height='32'
							src='./logos/knocker-icon.svg'
							width='32'
						/>
						<img
							alt='Knocker Web'
							className='h-10 dark:hidden'
							height='40'
							src='./logos/knocker-black.svg'
							width='200'
						/>
						<img
							alt='Knocker Web'
							className='hidden h-10 dark:block'
							height='40'
							src='./logos/knocker.svg'
							width='200'
						/>
					</div>

					{/* Success message - moved to top */}
					{knockMutation.isSuccess && result && (
						<div className='fade-in slide-in-from-top-4 mb-6 animate-in rounded-xl border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-lg dark:from-green-900/20 dark:to-emerald-900/20'>
							<div className='flex items-center'>
								<div className='mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 shadow-md'>
									<svg
										aria-label='Success checkmark'
										className='h-5 w-5 text-white'
										fill='none'
										role='img'
										stroke='currentColor'
										strokeWidth={3}
										viewBox='0 0 24 24'
									>
										<path
											d='M5 13l4 4L19 7'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
									</svg>
								</div>
								<h3 className='font-bold text-green-900 text-lg dark:text-green-100'>
									Success!
								</h3>
							</div>
							<div className='mt-3 text-green-800 text-sm dark:text-green-200'>
								<p>
									<strong>Whitelisted:</strong>{' '}
									<code className='rounded-md bg-green-100 px-2 py-1 font-mono text-xs shadow-sm dark:bg-green-800'>
										{result.whitelisted_entry}
									</code>
								</p>
								<p className='mt-2'>
									<strong>Expires in:</strong> {result.expires_in_seconds}{' '}
									seconds
								</p>
								<p className='mt-1 text-xs opacity-75'>
									<strong>Expires at:</strong>{' '}
									{new Date(result.expires_at * 1000).toLocaleString()}
								</p>
							</div>

							{/* TTL warning */}
							{showTtlWarning && (
								<div className='mt-4 rounded-lg border border-yellow-400 bg-yellow-50 p-3 shadow-sm dark:bg-yellow-900/20'>
									<p className='text-xs text-yellow-800 dark:text-yellow-200'>
										⚠️ TTL was capped by the server. Requested: {requestedTtl}s,
										Applied: {result.expires_in_seconds}s
									</p>
								</div>
							)}

							{/* Auto-knock toggle */}
							<div className='mt-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-100/50 p-3 dark:border-green-700 dark:bg-green-900/10'>
								<label
									className='font-medium text-green-900 text-sm dark:text-green-100'
									htmlFor={autoKnockToggleId}
								>
									Auto-knock on page load
								</label>
								<button
									aria-checked={enableAutoKnock}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
										enableAutoKnock
											? 'bg-green-500'
											: 'bg-gray-300 dark:bg-gray-600'
									}`}
									id={autoKnockToggleId}
									onClick={handleAutoKnockToggle}
									role='switch'
									type='button'
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
											enableAutoKnock ? 'translate-x-6' : 'translate-x-1'
										}`}
									/>
								</button>
							</div>
						</div>
					)}

					{/* Error message - moved to top */}
					{knockMutation.isError && (
						<div className='fade-in slide-in-from-top-4 mb-6 animate-in rounded-xl border-2 border-red-500 bg-gradient-to-br from-red-50 to-rose-50 p-5 shadow-lg dark:from-red-900/20 dark:to-rose-900/20'>
							<div className='flex items-center'>
								<div className='mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 shadow-md'>
									<svg
										aria-label='Error X mark'
										className='h-5 w-5 text-white'
										fill='none'
										role='img'
										stroke='currentColor'
										strokeWidth={3}
										viewBox='0 0 24 24'
									>
										<path
											d='M6 18L18 6M6 6l12 12'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
									</svg>
								</div>
								<h3 className='font-bold text-lg text-red-900 dark:text-red-100'>
									Error
								</h3>
							</div>
							<p className='mt-3 text-red-800 text-sm dark:text-red-200'>
								{knockMutation.error?.message || 'Failed to knock'}
							</p>
						</div>
					)}

					<form
						className='space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-xl transition-shadow hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800'
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
								className='w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 shadow-sm transition-all focus:border-[#fde562] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fde562]/50 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:focus:bg-gray-700'
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
								className='w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 font-mono text-gray-900 text-sm shadow-sm transition-all focus:border-[#fde562] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fde562]/50 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:focus:bg-gray-700'
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
								className='w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 shadow-sm transition-all focus:border-[#fde562] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fde562]/50 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:focus:bg-gray-700'
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
								className='w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 font-mono text-gray-900 text-sm shadow-sm transition-all focus:border-[#fde562] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fde562]/50 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:focus:bg-gray-700'
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
							className='w-full rounded-lg bg-gradient-to-r from-[#fde562] to-[#fcd645] px-4 py-3 font-semibold text-gray-900 shadow-md transition-all hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#fde562] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 dark:focus:ring-offset-gray-800'
							disabled={knockMutation.isPending}
							type='submit'
						>
							{knockMutation.isPending ? 'Knocking...' : 'Knock'}
						</button>
					</form>
				</div>
			</div>
		</>
	)
}
