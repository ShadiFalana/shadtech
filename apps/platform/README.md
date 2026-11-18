# ShadTech Platform

Bilingual IT services and support SaaS platform built in the existing Next.js App Router project with PostgreSQL, Prisma 6, Better Auth, OpenRouter, Tailwind and Base UI/shadcn.

> **Status:** functional local-development build with DEMO-labelled seed data. It is **not** a production deployment. External integrations remain unconfigured until credentials are supplied, and all public claims must be verified before release.

## Surfaces

| Path | Purpose | Access |
| --- | --- | --- |
| `/` | Public marketing site, services, solutions, products, industries, knowledge, blog, pricing, legal and status pages | Public |
| `/auth/customer/login` | Customer sign-in | Public |
| `/auth/staff/login` | Support-agent sign-in | Public |
| `/auth/admin/login` | Administrator sign-in | Public |
| `/auth/customer/register` | Immediate customer registration | Public |
| `/auth/request-access` | Admin/staff registration request awaiting administrator approval | Public |
| `/profile` | Personal profile, avatar, bio, password and session controls | Any signed-in role |
| `/dashboard` | Customer portal: tickets, service tickets, services, assets, contracts, invoices, payments, appointments, knowledge, notifications, settings | `CUSTOMER` |
| `/admin/account-requests` | Review registration requests and grant approved roles | `ADMIN`, `SUPER_ADMIN` |
| `/admin/users` | Create accounts and change roles | `ADMIN`, `SUPER_ADMIN` |
| `/support` | Support workspace: queues, ticket detail, customers, schedule, team, reports and AI | Support staff |
| `/admin` | Business administration: CRM, ITSM, ITAM/CMDB, finance, projects, content, reports and integrations | Admin staff |
| `/super-admin` | Platform tenants, users, plans, subscriptions, usage, health and audit | `SUPER_ADMIN` |

Arabic/RTL and English/LTR are supported across all surfaces. The locale is stored in the `shadtech-locale` cookie and mirrored in `localStorage`.

## Prerequisites

- Node.js 22+
- npm 10+
- Windows/macOS/Linux with permission to bind `127.0.0.1:5433`

## Local setup

From `apps/platform`:

```bash
npm install
cp .env.example .env
# Set BETTER_AUTH_SECRET. Do not commit real secrets.
npm run dev:db
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Open <http://localhost:3000>.

Seeded demo accounts (development only):

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `admin@shadtech.local` | `ChangeMe123!` |
| Admin | `admin2@demo.local` | `ChangeMe123!` |
| Support agent | `agent1@demo.local` | `ChangeMe123!` |
| Customer | `customer1@demo.local` | `ChangeMe123!` |

Use the role-specific login page. Roles are verified again on the server before any workspace is rendered.

## Verification

```bash
npm run check:i18n
npm run typecheck
npm run lint
npm run build
npm run db:seed   # safe to run twice
```

See [docs/SETUP.md](docs/SETUP.md), [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md), [docs/DEMO_DATA.md](docs/DEMO_DATA.md) and [docs/FEATURE_STATUS.md](docs/FEATURE_STATUS.md) before changing configuration or presenting the platform to others.

## Design rules

- Brand colors are fixed: `#24272D`, `#30343B`, `#F79432`, `#FFB15C`, `#F7F8FA`, `#FFFFFF`, `#20242A`, `#777F89`.
- Tagline: EN `Technology That Works. Support You Can Trust.` / AR `تقنية تعمل بكفاءة. ودعم يمكنك الاعتماد عليه.`
- Interface copy lives in `i18n/en.json` and `i18n/ar.json`; components must not hardcode interface text.
- Public pricing, testimonials, clients, partners, awards and certifications are never fabricated. Unverified records were removed from the seed.
- Ticket attachments are external reference links. Profile photo upload uses UploadThing only when `UPLOADTHING_TOKEN` is configured; otherwise the profile page shows the unconfigured state.
- External services are shown as **not configured** unless the required environment variables exist. Secrets are never rendered in the UI.

## PWA

The app ships a web manifest, brand icon and a minimal service worker. Authenticated and API routes are never cached. The service worker provides an offline fallback for public pages; it does not claim full offline operation of workspaces.
