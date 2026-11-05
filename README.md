# Level Up

**Train. Track. Progress.**

A responsive V1 training log for daily workouts, exercises, sets, strength progression, personal records, and training analytics. Nutrition is intentionally outside this release.

## Stack

- React 19, TypeScript, and Vite
- Tailwind CSS and a small responsive product style system
- React Router
- TanStack Query for server-state caching
- Axios API client
- Recharts for backend-provided analytics
- ESLint and Vitest with Testing Library

## Run locally

```sh
npm install
cp .env.example .env.local
npm run dev
```

The app always uses the backend for training data; it does not include a demo-data fallback. The default local backend is `http://localhost:8080`. Configure `VITE_API_BASE_URL` to the backend origin for the environment you want to use; `/api/v1` is added automatically, and a value that already ends in `/api/v1` is also accepted. Sign up at `/auth` and then log in. Login expects `{ user: { id, name, email }, accessToken }`; the access token and profile are kept in session storage and the token is sent on API requests. A 401 clears the session and redirects to login. A 403 indicates that the authenticated user cannot access that resource. App routes require a local signed-in session, but token validity and access control must be enforced by the backend on every API request. API requests are centralized under `src/api/`; React pages do not make fetch/Axios requests directly.

## Commands

```sh
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

## Environment and deployment

`VITE_API_BASE_URL` is a public frontend setting, not a place for credentials or secrets.

- `.env.example` is the safe local template.
- `.env.local` is ignored by Git.
- `.env.production.example` documents the production URL format. Set `VITE_API_BASE_URL` to the production backend origin in your deployment environment (for example, Vercel project settings); the value is embedded at build time. If unset, the app uses `http://localhost:8080`.

The intended public repository is [`sajwanmohit/level-up`](https://github.com/sajwanmohit/level-up). Create the GitHub repository with that name, then connect and push this local project.

## Application structure

```text
src/
  api/          typed API services and backend client
  components/   shared shell, charts, and UI primitives
  features/
    analytics/
    dashboard/
    exercises/
    prs/
    auth/
    workouts/
```

Routes include `/auth`, `/dashboard`, `/workouts`, `/workouts/new`, `/workouts/:workoutId`, `/exercises`, `/exercises/:exerciseId`, `/prs`, and `/analytics`. `/settings` redirects to `/auth`. A future nutrition module can be added as an independent feature without mixing it into training flows.

## Backend integration

The API client uses the documented `/exercises`, `/workouts`, `/exercise-sessions`, `/sets`, `/prs`, and `/analytics` endpoints. The workout composer can save a draft or complete the workout; draft workouts can have exercises and sets added, edited, or removed before completion. Each create flow retains the backend-issued UUIDs for subsequent requests. Dashboard, PR history, exercise progression, and completed-workout analytics use the matching backend analytics endpoints.

The API does not provide training preferences, a generic date-range analytics route, or an exercise-by-ID detail route. Authentication expects `POST /auth/signup` with `{ name, email, password }`, returning an empty 201 response, and `POST /auth/login` with `{ email, password }`, returning `{ user: { id, name, email }, accessToken }`. Every API request includes the access token when a session exists, including exercise catalog routes. The frontend supplies `userId` query/body values from the logged-in user; the backend must validate ownership. Role-based authorization and subscription entitlements are out of scope for this release; protected API endpoints must validate token authenticity, expiration, and user identity server-side.
