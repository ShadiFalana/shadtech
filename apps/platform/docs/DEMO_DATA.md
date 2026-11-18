# Demo data policy

`prisma/seed.ts` creates labelled development data. It is useful for navigating every workspace, but it is not evidence of real customers, prices, assets, contracts, certifications, awards, testimonials or partners.

Rules:

- Every seeded operational record uses a `demo_`/`DEMO-` identifier or label.
- The seed removes only its own prefixes on repeat runs.
- Unverified public testimonials, client logos and partner names are deleted by the seed and must not be reintroduced without written approval.
- Subscription plans are inactive skeletons with zero price and explicitly say they are not publishable.
- Demo blog articles remain unpublished.
- Demo announcements remain inactive.
- Product specifications are empty; size, model and price are confirmed in a written quotation.

Before production:

1. Create a clean database and run only migrations.
2. Do not run `npm run db:seed`.
3. Import verified operational data through reviewed processes.
4. Remove demo login credentials and rotate `BETTER_AUTH_SECRET`.
