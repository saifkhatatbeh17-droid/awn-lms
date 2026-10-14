# Awn Frontend — Backend Handoff

## Runtime configuration

Every page has two host-configurable metadata values:

```html
<meta name="awn-api-base-url" content="https://your-host.example">
<meta name="awn-demo-mode" content="false">
```

Keep demo mode enabled only for demonstrations. Serve the site over HTTP(S); the login module and JSON fixtures do not work reliably when opened through `file://`.
The committed HTML pages explicitly set `awn-demo-mode` to `false`; missing or invalid runtime configuration also fails closed. Set the API base URL through the host deployment configuration. A configured API always disables demo storage, even if a page has been misconfigured.

For a clean static package, run `npm run build:production`. It creates `dist/awn` and excludes the public demo credential and assignment fixtures. The command intentionally fails if that output folder already exists so a stale package cannot be mistaken for a fresh build. It defaults the API base URL to `/` for a same-origin .NET deployment. For a separate API origin, set `AWN_API_BASE_URL` before building (for example, `$env:AWN_API_BASE_URL = "https://api.example"` in PowerShell); the build injects it into all pages. Serve the resulting folder from the .NET host or an approved static host.

## API adapters implemented

### Authentication

- `POST {awn-api-base-url}/api/auth/login`
- Request: `{ "username": "…", "password": "…" }`
- Success: `{ "user": { "username": "…", "name": "…", "role": "teacher" } }`
- Invalid credentials: HTTP `401`; other non-success responses are shown as a service error.
- The browser sends `credentials: include`. Set a Secure, HttpOnly session cookie on the server. Enforce authorization on every protected endpoint; the client-side role and `localStorage` session are display hints only.
- Roles currently recognized by the UI: `admin`, `teacher`, `principal`, `supervisor`, `student`, `parent`.

When no API base URL is set and demo mode is enabled, login reads `assets/data/users.json`. Its usernames/passwords are public demo fixtures and must never be replaced with real accounts or personal data.

### Assignments

- `GET /api/assignments` returns an array or `{ "items": [...] }`.
- `POST /api/assignments` accepts `{ "title": "…", "subject": "…", "dueDate": "YYYY-MM-DD" }` and returns the assignment or `{ "assignment": { ... } }`.
- `PATCH /api/assignments/{id}/status` accepts `{ "status": "pending" | "completed" }`; `204 No Content` is accepted.
- The server should enforce role/ownership rules, validation, date handling, and generate notifications. The demo adapter stores assignments in `localStorage` and creates local student/parent notifications.

## Still demo-only; do not enable for production

`ApiService` operations for notifications, behavior, attendance, feedback, organization details, and daily/quarterly plans still use browser `localStorage`. Several dashboard cards also contain sample figures. Those workflows need agreed endpoint contracts and adapters before a production handoff. The UI displays an explicit notice for unimplemented dashboard buttons; it does not save those actions.

## Deployment and security notes

- Do not deploy with `awn-demo-mode` enabled. The demo credential JSON is downloadable by every visitor.
- If the API is cross-origin, configure CORS for the exact frontend origin with credentials; configure cookie `Secure`, `HttpOnly`, and an appropriate `SameSite` policy, and add CSRF protection for state-changing requests.
- The frontend cannot secure a page or role by hiding routes. The .NET backend must authenticate and authorize every data request.
- Tailwind, SweetAlert2, Cairo/Material Symbols, and GSAP are loaded from CDNs. For controlled Ministry deployments, pin and preferably self-host these dependencies and define a Content Security Policy.
- Before release, run browser-based keyboard/screen-reader checks and visual checks at supported viewport sizes. The DOM smoke checks do not certify WCAG conformance or cross-browser rendering.
### System administrator

- Demo sign-in fixture: `admin` / `123` (public demonstration credentials only; never deploy these credentials).
- The role routes to `admin-dashboard.html`; its client-side `awn_session` guard is only a navigation aid. The .NET API must independently authenticate and authorize every request, and must never trust the browser session object.
- `GET /api/admin/users` returns an array of user records or `{ "items": [...] }`. Each record includes `id`, `username`, `name`, `role`, optional `organization`, and `isActive`.
- `POST /api/admin/users` accepts `{ "name": "…", "username": "…", "role": "…", "organization": "…" }` and returns a user or `{ "user": { ... } }`. Enforce uniqueness, role policy, validation, and audit logging server-side. Credential issuance and delivery belong to the backend.
- `PATCH /api/admin/users/{id}/status` accepts `{ "isActive": true }`; `204 No Content` is accepted. The backend must authorize the caller and record the change.
- When API base URL is empty and demo mode is enabled, the admin screen stores demo records in `localStorage` under `awn_admin_users`. Do not treat these records as persistent or authoritative.
## Production release gate

This repository contains a production-safe frontend package process, not a production-complete connected LMS. The backend is not present in this workspace. Do not announce the system as fully operational until the .NET team implements and verifies the authentication/session contract, server-side authorization, persistence, and the API workflows listed below. Login, assignments, and administrator user management have frontend HTTP adapters; notifications, behavior, attendance, feedback, organization details, and daily/quarterly plans are demo-only and intentionally blocked when demo mode is off. Dashboard sample figures must be replaced by live API data before they are used for official decisions.

The backend must treat `awn_session` and every value stored in browser storage as untrusted display state. Use an authenticated server session, enforce role and ownership checks on every request, validate inputs server-side, and apply CSRF protection to cookie-authenticated writes. Configure exact-origin CORS with credentials only when cross-origin hosting is required. Never expose demo fixtures in the deployed web root; the production packaging script excludes the known fixture files.

### Suggested API contracts still requiring implementation

- `GET /api/auth/session` to validate the HttpOnly session and return the minimal display identity and role after page reload.
- `GET /api/notifications?audience={role}` and `POST /api/behavior`.
- `GET /api/attendance?date=YYYY-MM-DD` and `PUT /api/attendance/{date}` with records keyed by stable student IDs.
- `GET/POST /api/feedback`, `PATCH/DELETE /api/feedback/{id}`.
- `GET/PUT /api/organization-profile`, `GET/PUT /api/plans/daily`, and `GET/PUT /api/plans/quarterly`.

Agree on response envelopes, validation errors, pagination, stable IDs, date/time zones, and authorization rules with the backend team before enabling these controls. Existing demo records use names in a few places; production contracts should use stable IDs and return display names separately.

### Release verification still required

- Build with `npm run build:production`; confirm the output contains no `assets/data/users.json` or `assets/data/assignments.json` and all pages have demo mode disabled.
- Provide a valid API base URL and verify login, session expiry, 401/403 handling, logout, and cross-origin cookie/CSRF behavior against the actual .NET environment.
- Pin and self-host runtime dependencies (Tailwind CDN, SweetAlert2, GSAP, Cairo, and Material Symbols) and configure a Content Security Policy appropriate to the final host.
- Complete keyboard-only, screen-reader, contrast, zoom/reflow, and supported-browser checks. Automated DOM smoke checks alone do not establish WCAG 2.1 AA or AAA conformance.
## Local demo access

Run `npm run build:demo` to prepare `dist/awn-demo`. This separate package explicitly enables demo mode and includes public sample users and assignments. Serve that folder over HTTP (for example, with VS Code Live Server) and open `index.html`; do not use `file://`. Demo credentials are listed in `assets/data/users.json` and are for local demonstration only. Never deploy `dist/awn-demo` or its credentials.