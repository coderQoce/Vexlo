# Vexlo Web

Vexlo is a responsive stablecoin payments prototype for African and emerging-market corridors. It includes a wallet experience, a six-step agent workflow, policy controls, protocol receipts, and embedded mini-app flows. The app clearly marks simulated behavior; the repository is not a production payment service.

The interface is built with React, Bootstrap 5.3.8 layout utilities, and the project's custom CSS design system. Next.js remains the React app framework so the server API, authentication, and backend routes stay part of the same project. Tailwind has been removed.

## Requirements

- Node.js 22 or newer
- Bootstrap 5.3.8 (installed from the project dependencies)
- PostgreSQL 14 or newer
- npm or pnpm

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and a random `SESSION_SECRET` of at least 32 characters. Keep secrets server-side and out of source control.
2. Install dependencies with `npm install` (or `pnpm install`).
3. Create the database schema and demo agent identities:

   ```sh
   npx prisma migrate dev --name init
   npm run db:seed
   ```

4. Start the app with `npm run dev` and open [http://localhost:3000](http://localhost:3000).

The default provider mode is `mock`. In development, `AUTH_OTP_MODE=mock` returns a demo OTP in the API response. Do not use demo credentials or mock OTP behavior for real accounts. Production sign-up and sign-in fail closed until an OTP delivery adapter is configured.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | HS256 session signing secret (32+ characters) |
| `AUTH_OTP_MODE` | `mock` for development; a delivery adapter is required for production |
| `VEXLO_PROVIDER_MODE` | `mock` by default; `live` selects configured provider adapters |
| `VEXLO_LIVE_PAYMENTS_ENABLED` | Explicit live-payment kill switch; defaults to `false` |
| `VEXLO_LIVE_AGENT_PIPELINE_ENABLED` | Additional gate for provider payout execution; defaults to `false` |
| `FLUTTERWAVE_SECRET_KEY` | Server-side Flutterwave API credential |
| `BLINDPAY_API_KEY`, `BLINDPAY_INSTANCE_ID` | BlindPay API configuration |
| `WISE_API_TOKEN`, `WISE_PROFILE_ID` | Wise API configuration |
| `LIGHTSPARK_API_TOKEN` | Lightspark credential; adapter remains unavailable until its SDK port is implemented |
| `STELLAR_HORIZON_URL`, `STELLAR_NETWORK_PASSPHRASE`, `STELLAR_USDC_ISSUER` | Stellar network and asset configuration |
| `KMS_KEY_REFERENCE` | Reference for a future KMS-backed Stellar signing integration; no secret key is read from environment |
| `SMTP_URL`, `SMS_PROVIDER_URL` | Reserved for outbound notification adapters; not wired yet |

Never prefix provider credentials or session secrets with `NEXT_PUBLIC_`. Never put a Stellar secret key in the app, environment, or browser.

## Commands

```sh
npm run dev         # local development
npm run lint        # static lint checks
npm test            # unit tests
npm run build       # generate Prisma client and build Next.js
npm run db:migrate  # create/update local database schema
npm run db:seed     # seed simulated agent identities
```

Regenerate and commit a package lockfile using the package manager chosen for deployment. Deployments should use a managed PostgreSQL database, a Node 22 runtime, HTTPS, managed secrets, database backups, and a KMS/vault integration before enabling any real money movement.

## Architecture

- `app/` contains the Next.js App Router UI and REST endpoints.
- `components/` contains the responsive wallet, Control Center, agent chat, and mini-app UI.
- `lib/` contains authentication/security helpers, policy and idempotency logic, and provider adapters.
- `prisma/schema.prisma` defines the persistent domain model; `prisma/seed.ts` inserts simulated agent identities.
- `tests/` contains policy and adapter unit tests.

The authenticated API covers registration and sessions, wallet and policy reads/updates, send/swap/deposit/withdraw actions, cards, provider quotes and payouts, receipts, Control Center logs, and mini-app orders. Financial actions require a session and PIN, apply server-side policy checks, write audit records, and use idempotency keys.

## Provider integration status

Mock mode is the safe default. Flutterwave has a server-side transfer adapter; Wise has a quote adapter but its payout path is intentionally unavailable pending a recipient and confirmation workflow; BlindPay has a quote adapter while payouts are unavailable pending its contract/onboarding flow. Lightspark requires an SDK-backed implementation and is unavailable. Stellar can build a payment transaction, but signing requires an injected KMS signer and live payments must be explicitly enabled. Provider APIs and credentials have not been exercised against live accounts in this prototype. A live transfer should not be enabled until the complete agent pipeline, durable recovery/reconciliation, operational monitoring, and provider-specific compliance requirements are in place.

The six-agent chain is represented in the demo payment workflow with ephemeral receipt signatures. Those signatures do not prove a real agent identity, and the workflow is not a deployed autonomous agent service. The chat uses deterministic intent parsing, not an LLM. Notifications, OTP delivery, WebAuthn/passkeys, KYC/AML and sanctions screening, real credential issuance, real DPoP, and live Stellar KMS signing are not implemented.

## Simulated and production status

**Simulated:** onboarding and OTP in development, demo wallet balances and rates, yield and card actions, local demo payments, agent execution and signatures, protocol status, inbound request feed, and mini-app fulfillment. No real KYC decision or money movement occurs in mock mode.

**Implemented foundations:** persistent data models, password hashing, signed server sessions, PIN-gated financial API paths, origin checks, input schemas, rate limiting, audit events, idempotency records, policy enforcement, and provider adapter interfaces. These foundations still need production operations review and deployment-specific hardening.

## Protocol references

- [Stellar JavaScript SDK](https://stellar.github.io/js-stellar-sdk/)
- [Flutterwave transfers API](https://developer.flutterwave.com/reference/create-a-transfer)
- [Wise API reference](https://docs.wise.com/api-reference)

