# Setup and operations

## Database

The local development database is an embedded PostgreSQL instance started by:

```bash
npm run dev:db
```

It listens on `127.0.0.1:5433` and uses the database `shadtech_platform`. The process stays in the foreground; keep it running in a separate terminal.

Migrations are versioned in `prisma/migrations`. Apply them with:

```bash
npm run db:deploy
```

`npm run db:migrate` is suitable while changing the schema locally; it creates a new migration.

## Seed

```bash
npm run db:seed
```

The seed is idempotent. It deletes and recreates only records whose IDs begin with `demo_` and never touches manually created records. It creates:

- 8 primary demo users plus 10 individual and 8 business customer profiles
- 3 organizations with memberships, locations and departments
- 32 tickets with messages, internal notes and activity logs
- 16 services, 15 products, 20 assets, 8 CMDB items and relations
- CRM, finance, ITSM, KB, project, notification, audit and AI demo records

All demo records are labelled `DEMO`/`demo` and must be replaced with verified data before production use.

## Environment

Copy `.env.example` to `.env`. The following are required for local startup:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

Production additionally requires:

- A real `BETTER_AUTH_SECRET`
- `PASSWORD_RESET_WEBHOOK_URL` (password reset is intentionally unavailable without it)
- HTTPS-compatible cookie settings (handled automatically when `NODE_ENV=production`)

Never commit `.env` or real credentials.

## Verification order

1. `npm run check:i18n`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`
5. Run the seed twice to confirm idempotency

No unit, integration or E2E test runner is installed in this workspace. Verification relies on the checks above plus manual role-by-role review. If a test runner is added later, tests should cover permission guards, customer scoping, locale parity and seed idempotency first.
