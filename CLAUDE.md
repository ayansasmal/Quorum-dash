# Quorum Dashboard

React SPA for the Quorum governance UI. Private — deployed by enterprise teams alongside the gateway.

Not published to npm. Teams build and serve it via Docker or static hosting behind the gateway.

Runs on port **3002** by default (Vite dev server).

---

## Purpose

Visual interface for engineering teams to:

- View the **knowledge graph** (Cytoscape.js)
- Review and resolve **pending decisions** (conflict queue)
- Browse **knowledge versions** with status and confidence
- Manage **deviations** from global catalog standards (accept / deny / defer)
- Track **portfolio conformance** across the org hierarchy (exec-gated)
- Inspect the **audit timeline** (tamper-evident chain)
- Edit **project config** with JSON Schema validation
- Monitor **system status** (Graphiti, PostgreSQL, gateway)

---

## Key Files

```
src/
  App.jsx                 — Router setup, auth guard
  main.jsx                — Vite entry point
  pages/
    Stats.jsx             — Overview stats + metrics + ConformanceCard (v0.4)
    Graph.jsx             — Knowledge graph (Cytoscape.js)
    Pending.jsx           — Pending decisions queue + overdue deferrals (v0.4)
    Knowledge.jsx         — Knowledge browser (version list) + denial_hint_count badge (v0.4)
    Deviations.jsx        — Deviation table + inline accept/deny/defer action panel (v0.4)
    Portfolio.jsx         — Org rollup banner + 4-level cascading filters + project table (v0.4)
    Audit.jsx             — Audit timeline
    Config.jsx            — Project config editor + Global Catalogs card (v0.4)
    Status.jsx            — System health status
    Admin.jsx             — Platform admin add/remove + project archival panel
    Login.jsx             — GitHub OAuth entry point
    NoProjects.jsx        — Self-serve welcome for authenticated users without a project
    ProjectSelector.jsx   — Project search + switch
  components/
    layout/               — Shell, nav, sidebar
    session/              — Session management components
    status/               — Status indicator components
  context/
    AuthContext.jsx        — GitHub OAuth → JWT state
    ThemeContext.jsx       — Light/dark theme
  api/                    — Typed API clients (one per domain)
  lib/                    — Shared utilities
```

---

## Development

```bash
npm run dev      # Vite dev server at http://localhost:3002 (hot-reload — use for active UI work)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

The gateway must be running at `http://localhost:3001` for the dashboard to function.

### Alternative: run via Docker (no Node.js, no npm install)

The dashboard can also run as a Docker nginx container inside the main Quorum stack.
This builds the SPA once and serves it behind nginx (same as production). Use this when
you want the dashboard running in the background without keeping a Vite terminal open.

```bash
# From the quorum/ repo (requires ../quorum-dash to exist as a sibling):
npm run docker:start:dash       # build image + start → http://localhost:3002
npm run docker:rebuild:dash     # rebuild after React code changes, then restart
npm run docker:stop:dash        # stop dashboard only
```

nginx inside the container proxies `/api/*`, `/auth/*`, and other gateway paths to
`http://gateway:3001` (Docker internal DNS) — same-origin from the browser, no CORS needed.

**When to use which:**
| Mode | Command | Use for |
|------|---------|---------|
| Vite direct | `npm run dev` (from quorum-dash/) | Active React dev — fastest hot-reload, no Docker overhead |
| Docker hot-reload | `npm run docker:start:dash:dev` (from quorum/) | React dev inside Docker; first start ~30s (npm ci), then hot |
| Docker nginx | `npm run docker:start:dash` (from quorum/) | Background "just works" — production-like, no terminal needed |

**Dashboard Dockerfile highlights:**
- Three-stage build (`deps` → `builder` → `runtime`) — source changes skip `npm ci`
- BuildKit `--mount=type=cache` for npm — only new packages downloaded on rebuild
- `.dockerignore` excludes `node_modules/` and `dist/` — build context is fast
- Runs as `nginx` user (non-root) on port 8080; host maps to `localhost:3002`

---

## E2E Tests

The dashboard no longer owns a separate Playwright or Docker E2E harness.
Unified API + UI end-to-end coverage now lives in `../quorum/e2e/`.

Run shared scenarios from the Quorum repo:

```bash
cd ../quorum
npm run test:e2e:env:setup
npm run test:e2e
```

Dashboard-specific browser scenarios live under `../quorum/e2e/scenarios/ui/`.

---

## Auth Flow

1. User visits `/` — redirected to `/login` if no JWT
2. Click "Login with GitHub" → `GET /auth/login` → GitHub OAuth
3. Gateway callback → issues ES256 JWT → stored in AuthContext
4. Users with no memberships remain authenticated and see the self-serve onboarding page
5. Project-scoped API calls include `Authorization: Bearer <jwt>` and `X-Quorum-Project`
6. On 401 → attempt silent refresh via `POST /auth/refresh`; on failure → back to `/login`

---

## Theme

Full light/dark theme via `ThemeContext`. Toggle in nav. Preferences persisted in localStorage.

---

## Notes

- Uses React 19 + React Router 7 + TanStack Query 5
- Graph visualization: Cytoscape.js with `cose-bilkent` + `dagre` layouts
- Config editor: validates against `GET /schema/config` JSON Schema from the gateway
- Config member rows must satisfy the shared schema: new rows derive `name` from `github_username`, while existing explicit names are preserved
- Project selector: search + pagination (10/page), supports cancel-back-to-project
