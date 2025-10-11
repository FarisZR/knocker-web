import {expect, test} from '@playwright/test'

test('renders knocker web form and performs successful knock', async ({page}) => {
	await page.goto('/')

	// Check that the form is visible
	await expect(page.getByRole('heading', {name: 'Knocker Web'})).toBeVisible()
	await expect(page.getByRole('textbox', {name: /endpoint url/i})).toBeVisible()
	await expect(page.getByRole('textbox', {name: /token/i})).toBeVisible()
	await expect(page.getByRole('button', {name: /knock/i})).toBeVisible()

	// Fill in the form
	await page.getByRole('textbox', {name: /endpoint url/i}).fill('https://knocker.example.com')
	await page.getByRole('textbox', {name: /token/i}).fill('test-token-123')
	await page.getByRole('spinbutton', {name: /ttl/i}).fill('1800')

	// Submit the form
	await page.getByRole('button', {name: /knock/i}).click()

	// Check for success message
	await expect(page.getByText(/success/i)).toBeVisible()
	await expect(page.getByText(/192\.168\.1\.100/)).toBeVisible()
	await expect(page.getByText(/1800 seconds/)).toBeVisible()
})

test('shows error message on failed knock', async ({page}) => {
	await page.goto('/')

	// Fill in the form with invalid token
	await page.getByRole('textbox', {name: /endpoint url/i}).fill('https://knocker.example.com')
	await page.getByRole('textbox', {name: /token/i}).fill('invalid-token')

	// Submit the form
	await page.getByRole('button', {name: /knock/i}).click()

	// Check for error message
	await expect(page.getByText(/error/i)).toBeVisible()
	await expect(page.getByText(/invalid api key/i)).toBeVisible()
})
