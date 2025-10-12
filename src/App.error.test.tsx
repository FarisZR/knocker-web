import {vi} from 'vitest'
import {render, screen} from './test-utils'

vi.mock('@/pages/KnockerPage', () => ({
	KnockerPage: () => {
		throw new Error('Forced error')
	}
}))

import {App} from './App'

it('shows error boundary fallback when a route throws', () => {
	render(<App />)
	expect(screen.getByText('Forced error')).toBeInTheDocument()
})
