import {render, screen} from '../test-utils'
import {LoadingOrError} from './LoadingOrError'

describe('LoadingOrError', () => {
	it('shows loading message when no error', () => {
		render(<LoadingOrError />)

		expect(screen.getByText('Loading...')).toBeInTheDocument()
	})

	it('shows error message when error provided', () => {
		const error = new Error('Test error message')
		render(<LoadingOrError error={error} />)

		expect(screen.getByText('Test error message')).toBeInTheDocument()
	})
})
