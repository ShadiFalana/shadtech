# ShadTech feature inventory and redesign baseline

This document is the working feature audit for the UI/UX redesign. It records the state found in the repository before activation work and the classification used for each area. It is intentionally truthful: a feature is not called functional because a button exists.

Statuses:

- **Fully functional** — real UI, real authorization, real persistence, and a working return path.
- **Partial** — real data or real mutation exists, but a workflow, producer, or cross-surface link is missing.
- **UI only** — renders information but has no activation path.
- **Disabled** — deliberately unavailable until configured or approved.
- **Requires external configuration** — code exists but a credential, webhook, or third-party account is absent.
- **Not implemented** — no implementation exists; navigation must state this plainly.

## Public website

| Area | Status | Notes |
|---|---|---|
| Homepage sections, service/solution/industry catalog | Partial | Catalog is bilingual; DB-backed detail pages were English-only. Homepage duplicated the public shell and ignored dark mode. |
| Contact, quote, consultation, assessment forms | Fully functional | Server actions persist records with validation, honeypot, and rate limiting. Hero intents were not passed through. |
| Service/solution/industry detail pages | Partial | Real DB records, but Arabic copy was missing for seeded records and service FAQ catalog data was not rendered. |
| Products | Partial | Category filter works; no product detail route or inquiry CTA. |
| Blog and knowledge | Fully functional (read-only) | Published DB records only; pagination/tagging absent. |
| FAQ | Partial | General FAQ search works; per-service FAQ section was empty. |
| Pricing | Disabled by data | Plans are seeded inactive at zero price; page correctly asks for a written quotation. |
| System status | Partial | Reports configuration state only; no live monitoring integration. |
| Invitations | Requires external configuration | Static notice; invitation delivery is not configured. |
| Careers | Disabled by data | No approved roles published. |
| Global search | Partial / security defect | `/search` queried internal tickets, customers, organizations, assets, invoices, and projects anonymously and rendered several cards without links. |

## Customer portal

| Area | Status | Notes |
|---|---|---|
| Dashboard KPIs and recent tickets | Fully functional | Real scoped Prisma queries. |
| Tickets list, detail, create, reply | Fully functional | Ownership checks are present on detail and reply paths. |
| Service requests and service tickets | Fully functional | Both write real records; service tickets are `SupportTicket` rows linked to `Service`. |
| Assets, contracts, subscriptions, quotes, invoices, payments, appointments | Partial | Real scoped read-only lists; no customer-side write workflows. |
| Knowledge base | Fully functional (read-only) | Links to public article pages. |
| Notifications | Partial | Mark-read actions work on real rows, but no runtime producer created notifications for ticket events. |
| AI assistant | Requires external configuration | `OPENROUTER_API_KEY`; shows an honest unconfigured state. |
| Profile, password, sessions | Fully functional | Avatar upload requires `UPLOADTHING_TOKEN`; form previously wiped `city`/`country`. |
| Settings | Partial | Language control works; profile theme preference was read-only. |
| Live chat, project records, customer FAQ, messages, security | Not implemented | Must be shown as unavailable, not as empty functional modules. |

## Support workspace

| Area | Status | Notes |
|---|---|---|
| Dashboard, queues, ticket list/detail | Fully functional | Real DB data; filters and status/assignment/priority actions are wired. |
| Conversation, internal notes, attachments | Fully functional | Internal notes are staff-only; attachments are external references until file storage is configured. |
| Customers, schedule, team, reports | Partial | Real read-only lists; no calendar write workflow. |
| Knowledge base | Partial | Read-only here; authoring lives in admin. |
| AI assistant | Requires external configuration | OpenRouter key required. |
| My queue, urgent, unassigned, organizations, conversations, live chat, service requests, SLA, appointments, saved responses | Not implemented or represented as filtered views | Navigation must use real routes and truthful states. |

## Admin and Super Admin

| Area | Status | Notes |
|---|---|---|
| Tickets, problems, changes, SLA, assets, CMDB, services, products, industries, blog, FAQs, partners, plans | Fully functional for create/delete | Real guarded server actions; most lack edit workflows and audit writes. |
| Users, roles, account requests | Fully functional | Server-side role rules, session revocation, audit records, last-super-admin protection. |
| Notifications | Partial | Mark-read works; no runtime producer. |
| Integrations and AI settings | Partial | Environment-derived status and setup guidance; no credential entry by design. |
| Analytics, reports, system health, audit logs | Partial | Real DB data, but charts were CSS bars, audit coverage incomplete, migration badge static. |
| Settings | Partial | Four allowlisted-by-UI keys editable; hidden key tampering risk found; `openrouter_model` was cosmetic. |
| Super Admin tenants/users/plans/subscriptions/usage/settings | UI only (read-only) | No super-admin mutation actions existed. |
| Contacts, incidents, service categories, maintenance, software licenses, CRM, sales pipeline, employees | Not implemented | Must be shown as unavailable. |

## External configuration register

| Integration | Required configuration | Current state |
|---|---|---|
| AI assistant | `OPENROUTER_API_KEY`, optional `OPENROUTER_MODEL` | Not configured |
| Email delivery | `PASSWORD_RESET_WEBHOOK_URL`, optional token | Not configured |
| Payments | `PAYMENT_WEBHOOK_SECRET` and provider credentials | Not configured |
| WhatsApp | `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_ID` | Not configured |
| RMM / remote desktop | `RMM_API_URL`, `RMM_API_TOKEN` | Not configured |
| Monitoring | `MONITORING_WEBHOOK_URL` | Not configured |
| SMS | `SMS_API_KEY` | Not configured |
| Avatar uploads | `UPLOADTHING_TOKEN` | Not configured |

No integration is displayed as connected unless its environment configuration is present.

## Audit-derived priority fixes

1. **P0** — authenticate and scope `/search`; remove anonymous access to internal records.
2. **P0** — require `admin.access` for `/admin/**`; support agents must not inherit admin pages.
3. **P1** — add notification producers for ticket creation/reply/status events.
4. **P1** — preserve `city`/`country` on profile update.
5. **P1** — add audit writes and setting-key allowlists for administrative mutations.
6. **P1** — localize catalog-backed public content in Arabic or clearly label English-only records.
7. **P2** — centralized navigation, one shell, route loading/error states, logical CSS, user menu, and permission-aware nav filtering.
8. **P2** — upgrade high-traffic tables and ticket UX with search/filter/sort/pagination and safe bulk actions.
