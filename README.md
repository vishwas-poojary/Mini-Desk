# MiniDesk: Library & Member Management Admin

A robust, production-grade full-stack administrative platform built with modern TypeScript architectural patterns:
- **Monorepo & Workspaces**: `pnpm` workspaces + `Turborepo`
- **Frontend**: Vite + React 19 + TypeScript + Vanilla CSS Design System
- **Backend**: Express 5 + Better Auth (Node 24 SQLite) + Redis Session Cache + Rate Limiting + SSE
- **Shared Types**: `@minidesk/types` for compile-time contract safety across boundaries

---

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
- **Backend** (`apps/backend/.env`):
  ```env
  PORT=5000
  CLIENT_URL=http://localhost:5173
  JWT_ACCESS_SECRET=minidesk_super_secret_access_jwt_key_2026
  JWT_REFRESH_SECRET=minidesk_super_secret_refresh_jwt_key_2026
  ACCESS_TOKEN_EXPIRES_IN=900
  REFRESH_TOKEN_EXPIRES_IN=604800
  TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
  WEBAUTHN_RP_NAME=MiniDesk Library Admin
  WEBAUTHN_RP_ID=localhost
  WEBAUTHN_ORIGIN=http://localhost:5173
  REDIS_URL=redis://localhost:6379
  BETTER_AUTH_SECRET=minidesk_super_secret_better_auth_key_2026_entropy_secure
  BETTER_AUTH_URL=http://localhost:5000
  ```
- **Frontend** (`apps/frontend/.env`):
  ```env
  VITE_API_URL=http://localhost:5000/api/v1
  VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
  VITE_AUTH_URL=http://localhost:5000
  ```

### 3. Run Development Servers
```bash
# Starts both frontend (port 5173) and backend (port 5000)
pnpm dev
```

### 4. Build for Production
```bash
pnpm build
```

### 5. Demo Credentials
| Role | Email | Password | Access Rights |
|---|---|---|---|
| 👑 **Admin** | `admin@minidesk.local` | `Admin123!` | Full Access (Catalog, Members, Loans, Passkeys) |
| 📖 **Librarian** | `librarian@minidesk.local` | `Lib123!` | Operations (Catalog, Members, Checkouts) |
| 👤 **Member** | `member@minidesk.local` | `Member123!` | Public Catalog & Personal Circulation Status |

---

## Architecture Decisions

The architectural decisions behind each core system component are outlined below:

### Topic 0: Monorepo Architecture (`pnpm` Workspaces + `Turborepo`)
- **Decision**: Manage frontend, backend, and types within a unified `pnpm` monorepo orchestrated by Turborepo.
- **Why**: Monorepos ensure shared contract types (`@minidesk/types`) remain atomic and synchronized across frontend and backend in a single commit, while `pnpm`'s hard-link content-addressable storage eliminates duplicate dependency storage and Turborepo caches pipeline task graphs for sub-second builds.

### Topic 1: Token Storage Strategy
- **Decision**: Store short-lived access tokens exclusively in volatile JavaScript memory and refresh tokens in `httpOnly`, `SameSite=Lax` cookies.
- **Why**: In-memory storage makes access tokens immune to client-side XSS exfiltration attacks, while `httpOnly` refresh cookies enable seamless session renewal across page reloads without exposing credentials to untrusted browser scripts.

### Topic 2: End-to-End Auth & Refresh Token Rotation
- **Decision**: Implement dual-token authentication featuring single-use refresh token rotation with family revocation on reuse.
- **Why**: Short token lifespans (15 minutes) reduce the exposure window of intercepted credentials, while refresh token rotation ensures that any replay or reuse attempt immediately revokes the entire token family to shut down hijacked sessions.

### Topic 3: Cloudflare Turnstile Bot Protection
- **Decision**: Require cryptographically signed Turnstile tokens validated strictly server-side via Cloudflare's `/siteverify` API endpoint before evaluating credentials.
- **Why**: Client-side CAPTCHA flags are trivially spoofed by automated HTTP bots, whereas server-side verification guarantees that Cloudflare's authoritative API confirms human provenance before compute-heavy credential hashing runs.

### Topic 4: Passkeys & WebAuthn (FIDO2)
- **Decision**: Provide passwordless origin-bound FIDO2 authentication via WebAuthn and Better Auth passkey integration.
- **Why**: Asymmetric public-key cryptography replaces phishable shared secrets with device-bound private keys (Windows Hello / Touch ID / TPM), guaranteeing that authentication responses can never be captured or replayed against counterfeit phishing domains.

### Topic 5: Reusable Generic TanStack DataTable
- **Decision**: Build a single generic `<DataTable<T> />` component powered by TanStack Table that manages sorting, global search filtering, column visibility, and pagination for both Catalog Items and Members.
- **Why**: Centralizing table primitives eliminates duplicated UI markup and pagination logic across features while providing decoupled, type-safe data accessors and automatic client-side state caching in `localStorage`.

### Topic 6: Responsive Mobile Card Pattern
- **Decision**: Collapse multi-column desktop tables into mobile cards (`*-mobile-card.tsx`) when the viewport drops below the 640px breakpoint.
- **Why**: Complex horizontal data tables degrade on mobile screens due to excessive horizontal scrolling, whereas card layouts preserve vertical thumb-friendly navigation while retaining full access to sorting and actions.

### Topic 7: Form Validation (React Hook Form + Zod)
- **Decision**: Standardize all modal inputs through a declarative `DynamicForm` utilizing React Hook Form paired with `@hookform/resolvers/zod`.
- **Why**: Zod schemas act as a single source of truth for both runtime input sanitization and static TypeScript inference, while React Hook Form minimizes unnecessary re-renders through uncontrolled component subscriptions.

### Topic 8: Application Shell & Nested Route Guards
- **Decision**: Structure the UI around a persistent application shell (`Sidebar` + `Header` + `<Outlet />`) protected by `<AuthGuard>` and `<RoleGuard>` wrappers.
- **Why**: Nested routing avoids layout teardown between page transitions while declarative route guards enforce role-based access control (RBAC) on the client before sensitive administrative views render.

### Topic 9: Redis Session Cache & Sliding-Window Rate Limiter
- **Decision**: Deploy Redis (`ioredis`) for active session tracking, instant token revocation, and atomic sliding-window rate limiting on `/api/*` routes with automatic in-memory fallback.
- **Why**: Redis provides microsecond-latency counter increments (`INCR` + `EXPIRE`) to protect auth endpoints from brute-force attacks while allowing stateless API clusters to share active revocation lists without disk I/O bottlenecks.

### Topic 10: Server-Sent Events (SSE) & Progressive Web App (PWA) Offline Sync
- **Decision**: Broadcast catalog events and checkouts using unidirectional HTTP Server-Sent Events with exponential client reconnects, paired with a PWA service worker and Dexie IndexedDB cache.
- **Why**: SSE delivers real-time notifications with lower protocol overhead and better proxy traversal than bidirectional WebSockets, while the service worker and IndexedDB ensure the application shell and catalog data remain fully browsable even during network dropouts.

---

## End-to-End Demo Runbook

Follow these steps to demonstrate all project capabilities:

### 1. Password Login & Turnstile Verification
1. Navigate to `http://localhost:5173/login`.
2. Click the **Admin** tab (pre-fills `admin@minidesk.local` / `Admin123!`).
3. Complete the Turnstile check (shows green checkmark).
4. Click **Sign In** — you will be redirected to the Dashboard overview with an active session.

### 2. Passkey / WebAuthn Authentication
1. On the login page, click **"Enroll / Register Passkey for this device"** (or click the passkey button).
2. Windows Hello / your browser will prompt to save a passkey for `localhost`.
3. Confirm with your PIN or biometric.
4. Log out, then click **"Sign In with Passkey / WebAuthn"** — you are authenticated passwordless in under 1 second!

### 3. Filterable & Sortable Generic DataTable
1. Navigate to **Catalog** (`/books`) or **Members** (`/members`).
2. **Search**: Type in the search box (e.g. `"Orwell"` or `"Eleanor"`) to filter rows across all columns.
3. **Sort**: Click any column header (Title, Author, Copies, Membership) to toggle ASC / DESC sorting.
4. **Pagination**: Switch page size (10 / 25 / 50) and navigate pages. Notice state persists on refresh.

### 4. Responsive Mobile Card Collapse
1. Open Developer Tools (F12) and toggle device emulation or shrink the window below `640px`.
2. Observe the tabular grid automatically collapse into responsive touch-friendly cards (`BookCardMobile` / `MemberCardMobile`) with full sort controls and mobile pagination.

### 5. Live SSE Real-Time Notification
1. Open two browser tabs side-by-side at `http://localhost:5173`.
2. In Tab 1, navigate to **Catalog** and click **"+ Add New Book"**.
3. Fill in the modal form validated by Zod and click submit.
4. In Tab 2, immediately observe:
   - A real-time toast notification: *"📚 Catalog Update: '...' added by ..."*
   - The table automatically re-fetches and displays the new item without reloading the page.
