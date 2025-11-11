# Castor Audit & Advisory Web Console

This project adapts the TailAdmin React + Tailwind template to deliver Castor's remote auditing console. It combines a Vite + React 18 frontend with Supabase for authentication, database, storage, and Edge Functions.

> **Status:** In-flight implementation with mocked data sources and stubbed Supabase Edge Functions. Replace the mock client with the real Supabase SDK when your project is ready.

## Prerequisites

- Node.js 18+ (Node 20 recommended)
- npm 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli) `>=1.180.2`

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Duplicate `.env.example` and supply real values when you connect to Supabase or third-party services.

   ```bash
   cp .env.example .env.local
   ```

3. **Start the development servers**

   In one terminal, start Supabase (optional while developing against mocks):

   ```bash
   supabase start
   ```

   In another terminal, run Vite:

   ```bash
   npm run dev
   ```

   Visit the URL printed by Vite (default `http://localhost:5173`).

## Available scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Launches the Vite dev server. |
| `npm run build` | Builds the production bundle and runs TypeScript checks. |
| `npm run preview` | Serves the production build locally. |
| `npm run lint` | Runs ESLint over the source files. |

## Supabase integration

The repository is structured to mirror a Supabase project:

- `supabase/migrations/20250101000000_initial_schema.sql` – schema, RLS policies, helper functions.
- `supabase/functions/*` – Edge Function stubs that currently return mock responses via a shared helper at `supabase/functions/_shared/response.ts`.

### Running migrations locally

```bash
supabase db reset
```

This command applies the provided migration to your local Supabase instance. For hosted projects, use `supabase db push` or apply via SQL editor after reviewing RLS policies.

### Deploying Edge Functions

Once real logic is implemented, deploy using:

```bash
supabase functions deploy process-upload
```

Repeat for each function directory. The current stubs compile under Deno and provide predictable JSON responses for frontend development.

## Environment variables

`frontend/.env` keys (prefixed with `VITE_`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_SENTRY_DSN` (optional)

`Supabase Config Vars` (used by Edge Functions):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `GRAPH_TENANT_ID`
- `GRAPH_CLIENT_ID`
- `GRAPH_CLIENT_SECRET`
- `GRAPH_SENDER`
- `ABR_API_KEY`
- `LLM_API_KEY`

See `.env.example` for the consolidated list.

## Frontend structure highlights

- `src/context/AuthContext.tsx` – Supabase-auth backed session context with mock fallbacks.
- `src/hooks/*` – Data hooks wrapping Supabase queries for audits, templates, evidence, etc.
- `src/pages/` – Route-aligned pages that reuse TailAdmin layout primitives:
  - `Dashboard/Home.tsx` – Role-aware overview widgets.
  - `Audits/` – List and detail consoles for reviewers.
  - `Uploads/UploadLanding.tsx` & `UploadWizard.tsx` – Client evidence intake flows.
  - `Admin/` – Self-service management pages for audit types, templates, and imports.
  - `Verify/VerificationPage.tsx` – Public certificate verification view.

## Development notes

- The Supabase client currently operates against mock data defined in `src/data/mockData.ts`. Swap to the real client by removing the mock layer in `src/lib/supabaseClient.ts`.
- Edge Function stubs use shared helpers so the frontend receives consistent `{ data, error }` envelopes.
- Role-based navigation and protected routes enforce Admin-only access to configuration screens.

## Testing

Run the production build (includes type checking):

```bash
npm run build
```

Add unit and integration tests as the API hardens. Suggested areas include data hooks, policy guards, and Edge Function logic once implemented.
