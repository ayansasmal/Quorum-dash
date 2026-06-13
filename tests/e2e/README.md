# Dashboard E2E Tests

Browser (`@ui`) end-to-end tests for the Quorum dashboard. These moved out of the
`quorum` gateway repo so the dashboard owns its own UI coverage and the gateway is
exercised purely as a **black box**.

## Black-box contract

These tests never import gateway source. They interact with two running services
over the network only:

| Service | Env var | Default | Role |
|---------|---------|---------|------|
| Gateway | `QUORUM_GATEWAY_URL` | `http://localhost:3001` | Seed state + read results over HTTP |
| Dashboard | `QUORUM_DASHBOARD_URL` | `http://localhost:3002` | The React app under test |

The gateway must be a **test gateway** configured with the committed ES256 test
public key (`tests/e2e/fixtures/test-public-key.pem`) so the test JWTs verify. This
is the same key pair the gateway repo uses for its own E2E suite.

When `QUORUM_DASHBOARD_URL` points at `localhost`, the Vite dev server is started
automatically (`npm run dev`). Point it at a deployed/containerised dashboard to
skip the auto-start.

## Running

```bash
# 1. Start a test gateway + its backing stack (in the quorum repo):
#    cd ../quorum && npm run test:e2e:env:setup

# 2. Run the dashboard E2E suite against it:
npm run test:e2e            # headless
npm run test:e2e:headed     # visible browser
npm run test:e2e:ui         # Playwright interactive UI
npm run test:e2e:report     # open the HTML report
```

Override either URL when the services live elsewhere:

```bash
QUORUM_GATEWAY_URL=https://gateway.test QUORUM_DASHBOARD_URL=https://dash.test npm run test:e2e
```

## Layout

```
tests/e2e/
  scenarios/                       — the @ui specs (one per gateway scenario family)
    02-knowledge-governance-ui     — S-02.8 conflict review, S-02.12 stale badge
    04-deviation-governance-ui     — S-04.7/8/9 deviations dashboard
    07-conformance-portfolio-ui    — S-07.5–8 conformance surfaces
    14-dashboard-visual            — S-14 graph / config / status / audit / selector
    16-knowledge-history-ui        — S-16.6 version-history drawer
    20-cross-catalog-search-ui     — S-20.8 search interaction
    23-self-serve-onboarding       — S-23.3 projectless-user welcome state
    22-portfolio-intelligence-ui   — S-22.5–8 portfolio page
  helpers/
    api.js        — axios client (Authorization + X-Quorum-Project) against the gateway
    jwt.js        — mints ES256 test JWTs from the committed key
    seed.js       — prerequisite state (activeEntry, conflict, deviation …) over HTTP
    browser.js    — injectSession(): bypasses GitHub OAuth via sessionStorage
    setup.js      — globalSetup: T0 probes + fixture config upload to the gateway
    teardown.js   — no-op (uid() key isolation means no cleanup)
  fixtures/
    test-private-key.pem / test-public-key.pem  — ES256 test key pair
    *.quorum.json                                — project/catalog configs uploaded in setup
```

## Scenario IDs

Every `describe` title keeps its original `S-XX.Y` ID so coverage stays traceable
back to the gateway E2E test plan (`quorum/docs/e2e/TEST-PLAN.md`). The API-level
halves of these scenarios remain in the gateway repo; only the browser halves live
here.
