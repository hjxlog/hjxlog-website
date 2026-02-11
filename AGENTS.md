# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Vite + React TypeScript frontend.
- `src/pages/`: route-level screens (e.g., `Blog.tsx`, `Dashboard.tsx`).
- `src/components/`: reusable UI and feature components (`dashboard/`, `tasks/`, `chat/`).
- `src/hooks/`, `src/utils/`, `src/types/`, `src/config/`: shared logic, helpers, typings, and API config.
- `server/`: Node.js + Express backend (`routes/`, `services/`, `jobs/`, `scripts/`, `utils/`).
- `database/`: SQL schema, preset data, and test data.
- `public/`: static assets. `dist/`: frontend build output.

## Build, Test, and Development Commands
- Frontend (repo root):
  - `npm run dev`: run Vite dev server on `http://localhost:3001`.
  - `npm run build`: create production frontend build.
  - `npm run preview`: preview built frontend locally.
  - `npm run lint`: run ESLint for `ts/tsx` files.
- Backend:
  - `cd server && npm run dev`: run API with file watch.
  - `cd server && npm start`: run API in standard mode.
  - `cd server && npm run ai:test`: run AI API integration script.
- Full stack containers:
  - `docker compose up --build`: start Postgres, backend (`3006`), frontend (`3001`).

## Coding Style & Naming Conventions
- Use 2-space indentation and semicolons.
- Frontend uses TypeScript (`strict` enabled) and ESLint (`@typescript-eslint` recommended rules).
- Use `@/*` path alias for imports from `src`.
- Naming:
  - React components/pages: `PascalCase` (e.g., `TaskKanban.tsx`).
  - Hooks: `useXxx` (e.g., `useDashboardData.ts`).
  - Utility modules/functions: `camelCase`.
  - Backend files end with role suffixes (`*Router.js`, `*Service.js`).

## Testing Guidelines
- No unified unit-test framework is currently configured.
- Minimum checks before PR:
  - `npm run lint`
  - `npm run build`
  - relevant backend script checks (for AI/external API changes): `cd server && npm run ai:test`
- Add tests/data updates in `database/test/` when schema-related behavior changes.

## Commit & Pull Request Guidelines
- Follow Conventional Commits seen in history: `feat(scope): ...`, `refactor(scope): ...`, `fix(scope): ...`.
- Keep commit scopes specific (examples: `tasks`, `database`, `admin`, `thoughts`).
- PRs should include:
  - concise summary and affected areas (`src/...`, `server/...`, `database/...`)
  - linked issue/task
  - screenshots/GIFs for UI changes
  - migration or `.env` update notes when config/schema changes
