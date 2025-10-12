import {Suspense} from 'react'
import {ErrorBoundary, type FallbackProps} from 'react-error-boundary'
import {Route, Routes} from 'react-router'
import {LoadingOrError} from '@/components/LoadingOrError'
import {KnockerPage} from '@/pages/KnockerPage'

function renderError({error}: FallbackProps) {
	return <LoadingOrError error={error} />
}

export function App() {
	return (
		<ErrorBoundary fallbackRender={renderError}>
			<Suspense fallback={<LoadingOrError />}>
				<Routes>
					<Route element={<KnockerPage />} index={true} />
					<Route element={<KnockerPage />} path='*' />
				</Routes>
			</Suspense>
		</ErrorBoundary>
	)
}
