# Project Documentation Rules (Non-Obvious Only)
- "src/" contains the web client only; there is no extension or separate backend in this repo.
- Provider examples and canonical API behavior are implemented in [`src/mocks/handlers.ts`](src/mocks/handlers.ts); documentation in README may be out-of-date.
- UI auto-knock uses URL param `autoKnock=true`; enabling requires saved session endpoint+token (see [`src/pages/KnockerPage.tsx`](src/pages/KnockerPage.tsx:78)).
- Session persistence key: `knocker_session` (see [`src/utils/sessionStorage.ts`](src/utils/sessionStorage.ts:8)).