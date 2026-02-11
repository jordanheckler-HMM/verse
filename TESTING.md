# Testing and CI

This repository has two Node/TypeScript projects:

- `backend` (Express API, TypeScript)
- `verse-flow-main` (Vite + React frontend)

## Local Test Commands

### Backend

Run all backend tests:

```bash
cd /Users/jordanheckler/lyra-app/backend
npm test
```

Run only backend unit tests:

```bash
cd /Users/jordanheckler/lyra-app/backend
npm run test:unit
```

Run only backend integration tests:

```bash
cd /Users/jordanheckler/lyra-app/backend
npm run test:integration
```

### Frontend quality checks

```bash
cd /Users/jordanheckler/lyra-app/verse-flow-main
npm run lint
npm run build
```

## Test Layout

- `backend/test/unit/*.test.cjs`: unit tests for core domain logic (`SessionManager`, `TimelineEngine`)
- `backend/test/integration/*.test.cjs`: integration tests for HTTP API boundaries (`session` + `timeline` routes)

## CI Workflow

GitHub Actions workflow: `.github/workflows/ci.yml`

It runs on:

- every pull request
- pushes to `main`

It executes:

1. Backend job
   - `npm ci`
   - `npm run type-check`
   - `npm test`
2. Frontend job
   - `npm ci`
   - `npm run lint`
   - `npm run build`

Any failing step fails the workflow immediately.

## Extending the Suite

- Add new backend pure-logic tests to `backend/test/unit`.
- Add new route/service boundary tests to `backend/test/integration`.
- Keep tests deterministic:
  - no external network calls
  - no dependence on pre-existing local files
  - reset singleton state between tests when needed.
