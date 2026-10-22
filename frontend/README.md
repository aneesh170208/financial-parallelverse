# Financial Parallelverse — Frontend

React 19 + TypeScript + Vite client for the Financial Parallelverse fintech demo.

## Run

From this directory:

```bash
npm install
npm run dev
```

The app runs at <http://localhost:5173> and proxies `/api` to the FastAPI server at `http://127.0.0.1:8000`. Override the proxy target with `VITE_API_PROXY_TARGET`. Set `VITE_API_URL` if the browser should call the API at a different absolute base.

The fastest way to run both halves is from the repository root:

```bash
./scripts/dev.sh
```

## Checks

```bash
npm test         # Vitest + Testing Library
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## Structure

- `src/pages/` — six product routes plus the 404 page.
- `src/components/` — feature components, layout shell and UI primitives.
- `src/lib/api.ts` — typed API client.
- `src/lib/app-context.tsx` — shared profile/dashboard state and refreshes.
- `src/types/api.ts` — API contracts mirrored from the backend.
- `src/index.css` — design tokens and global styles.

Pages are lazy-loaded so the initial bundle only ships the shell. See the root [`README.md`](../README.md) and [`AGENTS.md`](../AGENTS.md) for product behaviour, API documentation and contribution guidance.
