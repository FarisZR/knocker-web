# AGENTS.md

This file provides guidance to agents when working with code in this repository.

- Tests & commands:
  - Unit: `pnpm test` (runs vitest). Run a single file: `pnpm test -- src/utils/sessionStorage.test.ts` or filter by name: `pnpm test -- -t "sessionStorage"`. CI full run: `pnpm run test:ci`. See [`package.json`](package.json:7).
- Vitest specifics (non-obvious):
  - Vitest is configured in [`vite.config.ts`](vite.config.ts:16): uses `happy-dom`, `setupFiles: 'src/test-setup.ts'`, and includes `src/**/*.test.ts?(x)` so tests must match that pattern.
  - Coverage thresholds are strict (branches 95%, lines/statements 99%) — CI will fail if not met. See [`vite.config.ts`](vite.config.ts:19).
- MSW (mocks) gotchas:
  - MSW workerDirectory is `public` (`package.json` msw.workerdirectory). Node tests use `msw/node` server started from [`src/test-setup.ts`](src/test-setup.ts:1).
  - Strict mock mode is enabled when `import.meta.env.MODE === 'test'` OR `VITE_MSW_STRICT='true'`. Handlers enforce only `test-token-123` or `admin-token-456` in strict mode; in browser/dev any non-empty token is accepted. See [`src/mocks/handlers.ts`](src/mocks/handlers.ts:7) and [`playwright.config.ts`](playwright.config.ts:24).
  - Playwright sets `VITE_MSW_STRICT: 'true'` for its webServer — e2e tests require the valid test tokens unless you override env.
- Project-specific style rules (from Biome):
  - Formatter uses tabs and single quotes (JSX single quotes) — see [`biome.json`](biome.json:14).
  - Naming/file-naming allows camelCase, kebab-case, PascalCase and enforces ASCII; tests disable naming enforcement. See [`biome.json`](biome.json:85).
  - `public/**` is excluded from lint/formatting.
- App-specific conventions:
  - API payloads use snake_case (intentionally ignored by linter via `biome-ignore` in several files). See [`src/api/knocker.ts`](src/api/knocker.ts:7) and [`src/mocks/handlers.ts`](src/mocks/handlers.ts:91).
  - Session persistence uses key `knocker_session` and functions silently swallow storage errors — use `loadSession()` / `saveSession()` from [`src/utils/sessionStorage.ts`](src/utils/sessionStorage.ts:8).
  - Test utilities set QueryClient defaults (no retries, GC disabled) to avoid flaky tests — see [`src/test-utils.tsx`](src/test-utils.tsx:7).
- E2E notes:
  - Playwright webServer command is `pnpm dev` and baseURL is `http://localhost:5173`. Playwright will reuse an existing server locally (but not in CI). See [`playwright.config.ts`](playwright.config.ts:24).
- Quick gotchas to prevent mistakes:
  - Running dev (browser) will accept non-empty tokens, but tests/e2e expect specific tokens — use the correct test tokens when running automated tests.
  - Coverage is strict; add targeted tests or lower thresholds deliberately and intentionally in `vite.config.ts`.