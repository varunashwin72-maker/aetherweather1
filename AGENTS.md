# AetherWeather — sandbox (Base44) notes

Non-obvious things learned while standing this project up. Manifests already
describe the stack; this file only records what they don't say.

## What this project is
Frontend-only SPA (Vite + React + TypeScript + Tailwind). There is **no backend
service** to run: weather/air-quality/geocoding data is fetched by the browser
from the keyless Open-Meteo API, and auth + notification storage live in a
**hosted Supabase project** (an external managed service).

## Running it
```bash
docker compose -f docker-compose.base44.yml up -d     # web on host port 3000
docker compose -f docker-compose.base44.yml logs -f web
```
- The service runs the repo's own `vite` dev server from a bind mount (`.:/app`),
  so repo edits hot-reload in the preview. No image rebuild is needed for code
  changes.
- Dependencies are installed at container start (`npm ci`) into the named Docker
  volume `web_node_modules`, **not** into the sandbox checkout. The sandbox has
  no Node installed, so run project scripts inside the container:
  ```bash
  docker compose -f docker-compose.base44.yml exec web npm run typecheck
  docker compose -f docker-compose.base44.yml exec web npm run lint
  ```
- `CHOKIDAR_USEPOLLING=true` is set because bind-mounted file events are not
  reliably delivered in the sandbox; without it hot reload can miss edits.
- Vite is pinned by `package-lock.json` to 5.4.8, which predates the dev-server
  host allowlist, so no `server.allowedHosts` config is required. If the lockfile
  is ever bumped to Vite >= 5.4.12 / 6.1, the preview origin must be allowlisted
  (`allowedDevOrigins` / `allowedHosts`) gated on `BASE44_PREVIEW_MODE === '1'`.

## Credentials
The **entire UI is gated behind Supabase sign-in** (`src/App.tsx` returns
`<LoginPage />` until `useAuth()` resolves a user), so without working Supabase
credentials the preview only ever shows the login screen.

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required. Both are read at
  dev-server start (`src/lib/supabase.ts`, via `import.meta.env`), so the `web`
  service must be restarted after they change — the platform handles that when
  secrets are updated.
- `src/lib/supabase.ts` builds the client at module load with
  `createClient(url, anonKey)`, which throws on an empty value and would white-screen
  the app. `.env.base44-defaults` therefore carries a syntactically valid
  **placeholder** so the app boots and renders the login gate. The anon key is a
  public-by-design key (it ships in the client bundle); the service role key must
  never be used here.
- `supabase/migrations/20261010041010_create_user_alert_notifications.sql` must be
  applied to the Supabase project for alert notifications to persist. The app
  swallows failures from that table (`useNotifications`, `useAlertNotifier`), so
  a missing migration looks like "no notifications" rather than an error.
- Weather needs **no** credentials: `VITE_WEATHER_API_PROVIDER` defaults to
  `open-meteo`, which is keyless. Only set it to `openweather` together with a real
  `VITE_WEATHER_API_KEY`. The key in `.env.example` is a sample value — do not reuse
  it.
- Secrets are delivered at `/run/base44/app.env` and listed **last** in the
  service's `env_file:`, so a value from the Base44 Secrets page always overrides
  the placeholder in `.env.base44-defaults`.

## Verifying it works
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` → `200`.
- Confirm the served frontend is live source, not a prebuilt bundle:
  `curl -s http://localhost:3000/src/main.tsx | head` should return JSX-transformed
  module code, and the HTML should reference `/@vite/client`.
- Container health: `docker compose -f docker-compose.base44.yml ps` → `(healthy)`.
  The healthcheck fetches `/` with Node's built-in `fetch`.
- Signed-in screens (dashboard, forecast, radar, alerts, notification bell) can only
  be exercised after signing in against a real Supabase project.
