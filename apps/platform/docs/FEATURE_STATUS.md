# Feature status

This document describes what the codebase actually does. It intentionally avoids roadmap language presented as completed work.

## Working locally

- Bilingual public site with Arabic RTL and English LTR.
- Role-specific authentication with server-side role and permission checks.
- Immediate customer registration; admin/staff registration requests that only an administrator can approve.
- Administrator-created accounts with server-side role granting; privileged roles cannot be selected through public sign-up.
- Personal profile with avatar, optional bio, password change and session controls.
- Customer portal with ticket creation, service tickets, replies, services, invoices, subscriptions and record lists backed by PostgreSQL.
- Support workspace with ticket queues, detail view, customer context, activity history and reference attachments.
- Admin and super-admin workspaces with real Prisma counts and record lists.
- Global search over tickets, customers, organizations, assets, services, products, invoices, projects and KB articles.
- Notifications with mark-as-read actions.
- Audit log views.
- Multi-tenant organization records with memberships, locations and departments.
- PWA manifest, brand icon, service worker and offline fallback for public pages.
- Idempotent demo seed.

## Deliberately limited

- **AI:** requires OpenRouter configuration. Without it, no model call is made and the UI says so.
- **Payments:** no payment provider is connected. Invoices and payments are records only.
- **Email/SMS/WhatsApp:** require webhooks or provider credentials. No delivery is claimed.
- **RMM/remote desktop:** requires credentials and explicit customer consent; no live session is implemented.
- **Monitoring:** public status is configuration-only unless a monitoring webhook is configured.
- **File storage:** ticket attachments remain reference URLs. Avatar uploads require `UPLOADTHING_TOKEN`; the profile page reports the unconfigured state honestly when it is absent.
- **Open roles:** no job model exists; the careers page shows an honest empty state.
- **Production deployment:** secrets, domain, HTTPS, backup policy, observability and support policies must be configured and reviewed separately.

## Data honesty

Demo records are labelled. No fabricated customer names, prices, specifications, testimonials, clients, partners, awards or certifications are rendered as verified facts. Metrics shown in reports are calculated from database records, not simulated.
