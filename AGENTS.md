# Quorum Dashboard Agent Guide

React 19 and Vite dashboard for the Quorum gateway. This repository is private
and deploys independently from the gateway and MCP packages.

## Commands

```bash
npm run dev
npm run build
```

The development server runs on `http://localhost:5173` and proxies gateway
requests to `VITE_GATEWAY_URL`, which defaults to `http://localhost:8002`.

## Authentication

- `src/context/AuthContext.jsx` owns JWT persistence and project selection.
- A valid JWT does not imply an active project. Authenticated users with no
  memberships render `src/pages/NoProjects.jsx`.
- Project-scoped API calls add `X-Quorum-Project` through
  `src/api/client.js`. Do not send that header when no project is selected.
- The dashboard never grants authorization by itself. Gateway middleware is
  authoritative for membership and platform-admin checks.
- Admin removal is allowed for the current user when another admin remains.
  Disable the last removal in the UI, but preserve the gateway's `last_admin`
  guard as the authoritative check.

## Frontend Conventions

- Follow the existing Tailwind light/dark theme and component patterns.
- Use TanStack Query v5 object syntax and invalidate the narrowest stable query
  key after mutations.
- Keep project-scoped routes behind `ProtectedRoute`; do not mount `Layout`
  for projectless users because its children issue project-scoped queries.
- Add JSDoc to new components, functions, and non-obvious state or constants.
- Config members require both `name` and `github_username`; dashboard-created rows
  derive `name` from the username unless an explicit display name already exists.
- Config visibility uses `currentProjectData.role === 'principal_architect'` or
  `user.is_admin`; slim JWT-backed `user.role` is not authoritative. Public
  projects are read-only for authenticated non-members, and public-to-private
  changes require confirmation.

## Verification

Run `npm run build` after frontend changes. Run the relevant Playwright scenario
for behavior changes from the unified Quorum-owned E2E suite in
`../quorum/e2e/`, and use the in-app browser for significant visual changes.
Projectless browser coverage now lives in
`../quorum/e2e/scenarios/ui/23-self-serve-onboarding.spec.js`.

## E2E Ownership

- `quorum-dash` no longer owns a separate Playwright or Docker E2E harness.
- API + browser end-to-end coverage now lives under `../quorum/e2e/`.
- When changing dashboard behavior, update or run the relevant UI scenario from
  the shared Quorum suite rather than recreating local test infrastructure here.

## CI/CD

- `.github/workflows/build.yml` publishes `ghcr.io/ayansasmal/quorum-dashboard`.
- The GHCR image exists for local development and E2E or containerized dashboard
  flows that need the dashboard packaged as a container image.
- Pull requests against `main` should validate the Docker build without
  publishing an image.
- Vercel remains the live production hosting path for the dashboard.
