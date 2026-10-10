# Vexlo Web App — A Friendly Guide

Vexlo is a website demo for a digital wallet. You can explore a dashboard, try sample money actions, review activity, and look at tools such as the card, currency swap, and Vexlo Agent screens.

**This is a demo, not a real bank or payment service.** The app labels sample activity as demo activity. Mock mode does not move real money, make real card payments, or provide real exchange rates. Some backend building blocks exist, but real payment providers and production security services are not fully connected.

## What was used to build it

You do not need to know these names to use the app. They describe the pieces used to make it:

- **Next.js** runs the website and its behind-the-scenes web addresses (called API routes).
- **React** builds the parts of the website that respond when you click buttons.
- **TypeScript** helps catch mistakes in the code while it is being written.
- **Bootstrap** provides some ready-made layout helpers. The Vexlo look and feel is mostly defined in its own CSS file.
- **PostgreSQL** stores account and transaction records when the database is configured.
- **Prisma** connects the app to PostgreSQL and describes the information the app stores.

## Find a screen or change how it looks

Most screens currently live together in one file. They are not separate web pages with separate addresses: the app changes the visible screen when you select something in its menu. In the code, each screen has a name such as `dashboard`, `send`, or `card`.

| What you see in Vexlo | Where to look in the project |
| --- | --- |
| Welcome animation, sign-in, create account, and account setup | `app/page.tsx` |
| Main dashboard and quick actions | `app/page.tsx` |
| Send, receive, deposit, withdraw, and swap screens | `app/page.tsx` |
| Transaction history and export | `app/page.tsx` |
| Earn yield and Vexlo card screens | `app/page.tsx` |
| Account settings | `app/page.tsx` |
| Control Center and Protocol Dashboard | `components/phase4.tsx` |
| Vexlo Agent chat | `components/agent-chat.tsx` |
| Vexlo Apps and Developer SDK screens | `components/mini-apps.tsx` |
| The site's colors, spacing, fonts, and responsive layout | `app/globals.css` |
| Page title, Bootstrap setup, and shared page wrapper | `app/layout.tsx` |
| The logo and other pictures | `public/images/` |

**A simple way to find a screen in the code:** open `app/page.tsx` in a code editor and search for its name, for example `screen==='send'` or `screen==='dashboard'`. The visible words and click behavior for that screen are nearby. To change the overall colors, sizes, or spacing, look for the matching style in `app/globals.css`.

## Where the behind-the-scenes work lives

The `app/api/` folder contains server routes. A route is a private web address the website can contact to do a task, such as sign in or request a payment. The folder names give a good clue about each task:

| Folder | What it handles |
| --- | --- |
| `app/api/auth/` | Sign in, sign out, registration, verification, and account details |
| `app/api/wallet/` | Wallet information |
| `app/api/send/`, `deposit/`, `withdraw/`, `swap/` | Money-action requests |
| `app/api/payments/` and `app/api/receipts/` | Payment records and receipts |
| `app/api/card/` | Card settings |
| `app/api/providers/` | Requests to payment and money-transfer services |
| `app/api/agent/` | Vexlo Agent chat requests |
| `app/api/policies/` and `control-center/` | Safety rules and activity logs |
| `app/api/apps/` | Demo app orders |

Shared server helpers are in `lib/`. For example, `lib/security.ts` handles security helpers, `lib/policy.ts` checks payment rules, `lib/financial-action.ts` supports payment actions, and `lib/providers/` contains connections (or demo substitutes) for external payment services.

The `prisma/` folder contains the database description (`schema.prisma`) and optional sample-data setup (`seed.ts`). The `tests/` folder contains automated checks for some backend rules.

## Run Vexlo on your computer

You will need **Node.js 22 or newer** and **npm**. If you want the database-backed features, you will also need a running **PostgreSQL 14 or newer** database. If Node.js is already installed, you can check by opening PowerShell in this folder and entering:

```powershell
node --version
npm --version
```

Then, from the project folder, install the app's packages and make a local settings file:

```powershell
npm install
Copy-Item .env.example .env
```

Open `.env` in a text editor. For local development, set `DATABASE_URL` to your PostgreSQL database and replace `SESSION_SECRET` with a long random value (at least 32 characters). Do not share `.env` or put real passwords or service keys in screenshots or public code.

Prepare the database, then start the website:

```powershell
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. To stop the local website, return to the PowerShell window and press **Ctrl+C**.

If you only want to look at the interface, you can start with `npm run dev`; pages that need the database may not work until PostgreSQL is set up.

## Useful commands

Run these from the project folder in PowerShell:

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the website for local use |
| `npm run lint` | Looks for common code problems |
| `npm test` | Runs the automated checks |
| `npm run build` | Prepares an optimized website build |
| `npx prisma migrate dev --name init` | Creates or updates the local database tables |
| `npm run db:seed` | Adds the sample agent entries used by the demo |

## Demo settings and real payment connections

The starter settings in `.env.example` select **mock mode**. In mock mode, sample payments and balances are simulations. Provider credentials (for example, Flutterwave, BlindPay, Wise, or Stellar settings) are optional for viewing the demo and are not needed to start the interface.

Do not turn on live payments just to make the demo work. Real payments require properly configured provider accounts, secure secret storage, approved operational and compliance processes, and additional engineering. The app does not include a real card issuer, real identity checks, or real-world account protection services. Never put passwords, provider secrets, or private blockchain keys in browser-side code or in a setting whose name starts with `NEXT_PUBLIC_`.

## Main folders at a glance

```text
app/          Website screens, shared styles, and server routes
components/   Larger screen sections used by the website
lib/          Shared behind-the-scenes helpers and provider connections
prisma/       Database structure and sample database setup
public/       Images and other files the browser can display
tests/        Automated checks for selected app behavior
```
