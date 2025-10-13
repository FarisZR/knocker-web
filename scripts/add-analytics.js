#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

// Analytics snippet to insert
const SNIPPET =
	'<script defer data-domain="knocker.fariszr.com" src="https://pa.fariszr.com/js/pls.js"></script>'

function main() {
	const target =
		process.argv[2] || path.join(process.cwd(), 'dist', 'index.html')

	// safety: avoid editing repository source `index.html` accidentally
	const repoIndex = path.join(process.cwd(), 'index.html')
	if (
		path.resolve(target) === path.resolve(repoIndex) &&
		process.env.ALLOW_SOURCE !== '1'
	) {
		console.error(
			'Refusing to modify source index.html. To override set ALLOW_SOURCE=1'
		)
		process.exit(3)
	}

	try {
		const html = fs.readFileSync(target, 'utf8')

		if (html.includes(SNIPPET)) {
			console.log(`Analytics snippet already present in ${target}`)
			process.exit(0)
		}

		const headClose = html.indexOf('</head>')
		if (headClose === -1) {
			console.error(`No </head> tag found in ${target}`)
			process.exit(2)
		}

		const before = html.slice(0, headClose)
		const after = html.slice(headClose)

		// preserve indentation similar to existing file
		const insertion = `    ${SNIPPET}\n`
		const newHtml = before + insertion + after

		fs.writeFileSync(target, newHtml, 'utf8')
		console.log(`Inserted analytics snippet into ${target}`)
		process.exit(0)
	} catch (err) {
		console.error(err?.message ?? err)
		process.exit(1)
	}
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) main()
