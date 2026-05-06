# SecureBank

A full-stack secure online banking web app with AES-256-GCM encrypted transactions, user KYC onboarding, ATM card dashboard, and admin oversight panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — starts Python crypto service + builds + runs API (port 8080)
- `pnpm --filter @workspace/secure-banking run dev` — runs Vite frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` (Postgres), `SESSION_SECRET` (express-session)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, Wouter routing, TanStack Query v5, Tailwind CSS v4, animejs v4, shadcn/ui
- API: Express 5, express-session (cookie-based auth)
- Crypto: Python Flask service (AES-256-GCM via `cryptography` lib) on port 5001 — encrypts/decrypts transaction records at rest
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts (30+ endpoints)
- `lib/db/src/schema/` — Drizzle schema: users, transactions, complaints, admins tables
- `artifacts/api-server/src/routes/` — Express route handlers (auth, users, transactions, complaints, admin)
- `artifacts/api-server/crypto/aes_service.py` — Python AES-256-GCM Flask service
- `artifacts/api-server/src/lib/crypto.ts` — Node.js HTTP client calling the Python service
- `artifacts/secure-banking/src/pages/` — all frontend pages (Home, Login, Register, Dashboard, Deposit, Withdraw, Transfer, History, Complaints, Settings, Admin*)
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks + Zod schemas

## Architecture decisions

- **Python for crypto**: AES-256-GCM encryption is handled by a separate Python Flask microservice (port 5001) called over localhost HTTP. This keeps the crypto isolated and uses the battle-tested `cryptography` library.
- **Cookie-based sessions**: express-session with `sameSite: lax` in dev, `none` in prod. Frontend uses `credentials: "include"` on all fetch calls.
- **Contract-first API**: OpenAPI spec written first, then Orval generates typed React Query hooks. Frontend never writes raw fetch calls.
- **Encrypted transaction records**: Every transaction amount/description is encrypted before DB storage and decrypted on read via the Python service.
- **animejs v4 named exports**: Uses `import { animate, stagger } from "animejs"` — v4 removed the default export.

## Product

- **User flow**: Register with KYC → admin approves → login with account number + PIN → ATM card dashboard → deposit/withdraw/transfer → transaction history → complaints
- **Admin flow**: Login → view pending users → activate/reject accounts → monitor all transactions and complaints with system stats
- **Seeded data**: admin (`admin`/`admin123`), Alice (`SB2024000001`/PIN:`1234`), Bob (`SB2024000002`/PIN:`5678`), Charlie (pending)
- **USP — Duress PIN / Stealth Mode**: Users set an emergency PIN in Settings. Logging in with it shows a decoy ₹500 account with no real data (session.duressMode=true gates all transaction + balance responses). A CRITICAL `DURESS_ACCESS_DETECTED` event fires silently in the admin Firewall. Dashboard shows "Protected Mode Active" amber banner. hasDuressPin + duressMode fields in UserProfile.
- **USP — Trusted Device System**: Login sends deviceToken (localStorage UUID) + deviceName (UA-derived). If user has trusted devices and this token isn't one → HIGH `UNKNOWN_DEVICE_LOGIN` alert fires in Firewall + user sees a "New Device Detected" interstitial. Settings page manages registered devices (add/remove). Schema: `trusted_devices` table.
- **USP — Transfer Time-Lock**: Users set a threshold in Settings (e.g. ₹5,000). Transfers above it enter `pending_locked` status for 5 min — sender's balance reserved, recipient not credited yet. Countdown visible in History with Cancel button. Expired locks auto-execute (lazy evaluation on history load). Schema: `lock_expires_at` on transactions, `lock_threshold` on users.

## User preferences

- Python for cybersecurity / crypto builds
- White background with doodle/sketch theme (cross-hatch pattern)
- animejs for visual enhancements and entrance animations

## Gotchas

- API server dev script starts Python service in background THEN builds + starts Node: `python3 crypto/aes_service.py & pnpm run build && pnpm run start`
- `setBaseUrl("")` in `main.tsx` — generated API paths already include `/api` prefix from OpenAPI `servers: [{url: /api}]`
- animejs v4: use `animate(target, opts)` and `stagger(n)` named imports — no default export
- `.doodle-bg` CSS class adds background-image pattern only (no `position: absolute`)
- After any route/schema change, restart the API Server workflow to rebuild

## Pointers

- See `pnpm-workspace` skill for workspace structure and TypeScript setup
- See `lib/api-spec/openapi.yaml` for all endpoint definitions
