import './global.css'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter} from 'react-router'
import {App} from './App'

const queryClient = new QueryClient()

async function enableMocking() {
	// Only enable mocking during local development. This prevents the
	// service worker from running in preview/production builds.
	if (!import.meta.env.DEV) {
		return
	}
	const {worker} = await import('./mocks/browser')
	return worker.start()
}

const container = document.querySelector('#root')
enableMocking()
	.then(() => {
		if (container) {
			const root = createRoot(container)
			root.render(
				<StrictMode>
					<QueryClientProvider client={queryClient}>
						<ReactQueryDevtools initialIsOpen={false} />
						<BrowserRouter basename={import.meta.env.BASE_URL}>
							<App />
						</BrowserRouter>
					</QueryClientProvider>
				</StrictMode>
			)
		}
	})
	.catch(error => {
		throw new Error(`Failed to enable mocking: ${error}`)
	})
