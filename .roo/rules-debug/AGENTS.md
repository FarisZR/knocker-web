# Project Debug Rules (Non-Obvious Only)
- Node tests start MSW server via [`src/test-setup.ts`](src/test-setup.ts:1) (msw/node). Browser/dev uses worker in [`public/mockServiceWorker.js`](public/mockServiceWorker.js:1).
- Playwright's webServer sets `VITE_MSW_STRICT='true'` so e2e require strict tokens (`test-token-123` or `admin-token-456`). See [`playwright.config.ts`](playwright.config.ts:24).
- Playwright reuses a running dev server locally (reuseExistingServer: true). When not running, webServer will run `pnpm dev`.
- Run single e2e: `npx playwright test tests/app.spec.ts`. To run with UI: `pnpm run test:e2e`.
- Vitest uses `setupFiles: 'src/test-setup.ts'` and `environment: 'happy-dom'` — do NOT start another MSW server in node tests.
- Session helpers (`loadSession`/`saveSession`) silently swallow storage errors — tests rely on this behavior. See [`src/utils/sessionStorage.ts`](src/utils/sessionStorage.ts:8).
- The UI converts network "Failed to fetch" TypeError into a friendly message; other errors surface. See [`src/pages/KnockerPage.tsx`](src/pages/KnockerPage.tsx:49).
- MSW handlers expect API key in header `X-Api-Key`; strict mode only accepts the two tokens above. See [`src/mocks/handlers.ts`](src/mocks/handlers.ts:3).