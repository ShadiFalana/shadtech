import {
  AppointmentStatus,
  AssetStatus,
  BillingPeriod,
  ContractStatus,
  ExpenseStatus,
  InvoiceStatus,
  Locale,
  PaymentStatus,
  PrismaClient,
  Role,
  SubscriptionStatus,
  Theme,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import {
  industriesCatalog,
  productCatalog,
  productCategories,
  servicesCatalog,
  solutionsCatalog,
} from "../lib/public-catalog";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "ChangeMe123!";

const dateFromNow = (days: number, hour = 9) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function resetDemoData() {
  // Child records first. Only demo-prefixed rows are removed so manually
  // created operational data is never touched by a repeat seed.
  await prisma.ticketMessage.deleteMany({ where: { ticketId: { startsWith: "demo_ticket_" } } });
  await prisma.ticketAttachment.deleteMany({ where: { ticketId: { startsWith: "demo_ticket_" } } });
  await prisma.ticketActivityLog.deleteMany({ where: { ticketId: { startsWith: "demo_ticket_" } } });
  await prisma.supportTicket.deleteMany({ where: { id: { startsWith: "demo_ticket_" } } });

  await prisma.payment.deleteMany({ where: { invoiceId: { startsWith: "demo_invoice_" } } });
  await prisma.invoice.deleteMany({ where: { id: { startsWith: "demo_invoice_" } } });
  await prisma.subscription.deleteMany({ where: { id: { startsWith: "demo_subscription_" } } });

  await prisma.serviceRequest.deleteMany({ where: { id: { startsWith: "demo_request_" } } });
  await prisma.aIMessage.deleteMany({ where: { conversationId: { startsWith: "demo_chat_ai_" } } });
  await prisma.aIConversation.deleteMany({ where: { id: { startsWith: "demo_chat_ai_" } } });
  await prisma.chatMessage.deleteMany({ where: { sessionId: { startsWith: "demo_chat_" } } });
  await prisma.chatSession.deleteMany({ where: { id: { startsWith: "demo_chat_" } } });

  await prisma.assetHistory.deleteMany({ where: { assetId: { startsWith: "demo_asset_" } } });
  await prisma.asset.deleteMany({ where: { id: { startsWith: "demo_asset_" } } });
  await prisma.cIRelation.deleteMany({ where: { fromId: { startsWith: "demo_ci_" } } });
  await prisma.configurationItem.deleteMany({ where: { id: { startsWith: "demo_ci_" } } });

  await prisma.task.deleteMany({ where: { projectId: { startsWith: "demo_project_" } } });
  await prisma.project.deleteMany({ where: { id: { startsWith: "demo_project_" } } });
  await prisma.knowledgeArticle.deleteMany({ where: { id: { startsWith: "demo_kb_" } } });
  await prisma.blogPost.deleteMany({ where: { id: { startsWith: "demo_blog_" } } });
  await prisma.workflow.deleteMany({ where: { id: { startsWith: "demo_workflow_" } } });
  await prisma.notification.deleteMany({ where: { id: { startsWith: "demo_notification_" } } });
  await prisma.auditLog.deleteMany({ where: { id: { startsWith: "demo_audit_" } } });
  await prisma.announcement.deleteMany({ where: { id: { startsWith: "demo_announcement_" } } });

  await prisma.contract.deleteMany({ where: { id: { startsWith: "demo_contract_" } } });
  await prisma.appointment.deleteMany({ where: { id: { startsWith: "demo_appointment_" } } });
  await prisma.expense.deleteMany({ where: { id: { startsWith: "demo_expense_" } } });
  await prisma.quotation.deleteMany({ where: { id: { startsWith: "demo_quote_" } } });
  await prisma.opportunity.deleteMany({ where: { id: { startsWith: "demo_opportunity_" } } });
  await prisma.lead.deleteMany({ where: { id: { startsWith: "demo_lead_" } } });
  await prisma.problem.deleteMany({ where: { id: { startsWith: "demo_problem_" } } });
  await prisma.changeRequest.deleteMany({ where: { id: { startsWith: "demo_change_" } } });
  await prisma.release.deleteMany({ where: { id: { startsWith: "demo_release_" } } });
  await prisma.sLAPolicy.deleteMany({ where: { id: { startsWith: "demo_sla_" } } });

  await prisma.iTAssessmentAnswer.deleteMany({ where: { assessmentId: { startsWith: "demo_assessment_" } } });
  await prisma.iTAssessment.deleteMany({ where: { id: { startsWith: "demo_assessment_" } } });

  await prisma.organizationMembership.deleteMany({ where: { id: { startsWith: "demo_membership_" } } });
  await prisma.location.deleteMany({ where: { id: { startsWith: "demo_location_" } } });
  await prisma.department.deleteMany({ where: { id: { startsWith: "demo_department_" } } });
  await prisma.organization.deleteMany({ where: { id: { startsWith: "demo_org_" } } });

  // Previous seed revisions inserted unverified public testimonials, clients
  // and partner names. They are removed instead of being replaced.
  await prisma.testimonial.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.partner.deleteMany({});
  await prisma.fAQ.deleteMany({});
}

type DemoUserSpec = {
  key: string;
  email: string;
  name: string;
  role: Role;
};

async function upsertUser(spec: DemoUserSpec, password: string) {
  const id = `demo_user_${spec.key}`;
  const user = await prisma.user.upsert({
    where: { email: spec.email },
    update: {
      name: spec.name,
      role: spec.role,
      emailVerified: true,
      twoFactorEnabled: false,
    },
    create: {
      id,
      name: spec.name,
      email: spec.email,
      emailVerified: true,
      role: spec.role,
      twoFactorEnabled: false,
    },
  });

  await prisma.account.deleteMany({
    where: { userId: user.id, providerId: "credential" },
  });
  await prisma.account.create({
    data: {
      id: `demo_account_${spec.key}`,
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password,
    },
  });

  return user;
}

async function upsertProfile(
  key: string,
  userId: string,
  data: { phone?: string; company?: string; city?: string; country?: string; locale?: Locale },
) {
  return prisma.customerProfile.upsert({
    where: { userId },
    update: {
      phone: data.phone ?? null,
      company: data.company ?? null,
      city: data.city ?? null,
      country: data.country ?? null,
      locale: data.locale ?? Locale.EN,
      theme: Theme.SYSTEM,
    },
    create: {
      id: `demo_profile_${key}`,
      userId,
      phone: data.phone ?? null,
      company: data.company ?? null,
      city: data.city ?? null,
      country: data.country ?? null,
      locale: data.locale ?? Locale.EN,
      theme: Theme.SYSTEM,
    },
  });
}

async function seedUsers() {
  const password = await hashPassword(DEMO_PASSWORD);

  const primary: DemoUserSpec[] = [
    { key: "admin", email: "admin@shadtech.local", name: "Demo Super Admin", role: Role.SUPER_ADMIN },
    { key: "admin2", email: "admin2@demo.local", name: "Demo Administrator", role: Role.ADMIN },
    { key: "agent1", email: "agent1@demo.local", name: "Demo Support Agent One", role: Role.SUPPORT_AGENT },
    { key: "agent2", email: "agent2@demo.local", name: "Demo Support Agent Two", role: Role.SUPPORT_AGENT },
    { key: "content", email: "content@demo.local", name: "Demo Content Manager", role: Role.CONTENT_MANAGER },
    { key: "customer1", email: "customer1@demo.local", name: "Demo Individual One", role: Role.CUSTOMER },
    { key: "customer2", email: "customer2@demo.local", name: "Demo Individual Two", role: Role.CUSTOMER },
    { key: "customer3", email: "customer3@demo.local", name: "Demo Individual Three", role: Role.CUSTOMER },
  ];

  const users: Record<string, Awaited<ReturnType<typeof upsertUser>>> = {};
  for (const spec of primary) {
    users[spec.key] = await upsertUser(spec, password);
  }

  for (const key of ["admin", "admin2", "agent1", "agent2", "content"]) {
    await prisma.employeeProfile.upsert({
      where: { userId: users[key].id },
      update: { title: "Demo Staff Record", department: "Operations", phone: "+000 000 0000" },
      create: {
        id: `demo_employee_${key}`,
        userId: users[key].id,
        title: "Demo Staff Record",
        department: "Operations",
        phone: "+000 000 0000",
      },
    });
  }

  const individualKeys = ["customer1", "customer2", "customer3"];
  const individualProfiles: Array<Awaited<ReturnType<typeof upsertProfile>>> = [];

  for (let i = 1; i <= 10; i++) {
    const key = i <= 3 ? individualKeys[i - 1] : `individual${i}`;
    const email = i <= 3 ? `customer${i}@demo.local` : `individual${i}@demo.local`;
    const user =
      i <= 3
        ? users[key]
        : await upsertUser(
            {
              key,
              email,
              name: `Demo Individual ${String(i).padStart(2, "0")}`,
              role: Role.CUSTOMER,
            },
            password,
          );
    individualProfiles.push(
      await upsertProfile(`individual${i}`, user.id, {
        phone: "+000 000 0000",
        city: i <= 3 ? "Demo City" : undefined,
        country: i <= 3 ? "Demo Country" : undefined,
      }),
    );
  }

  const businessProfiles: Array<Awaited<ReturnType<typeof upsertProfile>>> = [];
  for (let i = 1; i <= 8; i++) {
    const user = await upsertUser(
      {
        key: `business${i}`,
        email: `business${i}@demo.local`,
        name: `Demo Business Contact ${String(i).padStart(2, "0")}`,
        role: Role.CUSTOMER,
      },
      password,
    );
    businessProfiles.push(
      await upsertProfile(`business${i}`, user.id, {
        phone: "+000 000 0000",
        company: `Demo Business ${String(i).padStart(2, "0")}`,
        city: "Demo City",
        country: "Demo Country",
      }),
    );
  }

  return { users, individualProfiles, businessProfiles };
}

async function seedOrganizations(
  users: Record<string, { id: string }>,
  businessProfiles: Array<{ id: string; userId: string }>,
) {
  const organisations = [
    { key: "one", name: "Demo Organization 01", slug: "demo-organization-01", domain: "demo-org-01.local" },
    { key: "two", name: "Demo Organization 02", slug: "demo-organization-02", domain: "demo-org-02.local" },
    { key: "three", name: "Demo Organization 03", slug: "demo-organization-03", domain: "demo-org-03.local" },
  ];

  for (let index = 0; index < organisations.length; index++) {
    const orgSpec = organisations[index];
    const org = await prisma.organization.upsert({
      where: { slug: orgSpec.slug },
      update: { name: orgSpec.name, domain: orgSpec.domain, isActive: true },
      create: {
        id: `demo_org_${orgSpec.key}`,
        name: orgSpec.name,
        slug: orgSpec.slug,
        domain: orgSpec.domain,
      },
    });

    const members = [users.admin.id, users.agent1.id, businessProfiles[index].userId];
    for (let memberIndex = 0; memberIndex < members.length; memberIndex++) {
      await prisma.organizationMembership.upsert({
        where: {
          organizationId_userId: { organizationId: org.id, userId: members[memberIndex] },
        },
        update: { role: memberIndex === 2 ? "CUSTOMER_ADMIN" : "MEMBER" },
        create: {
          id: `demo_membership_${orgSpec.key}_${memberIndex}`,
          organizationId: org.id,
          userId: members[memberIndex],
          role: memberIndex === 2 ? "CUSTOMER_ADMIN" : "MEMBER",
        },
      });
    }

    await prisma.location.upsert({
      where: { id: `demo_location_${orgSpec.key}` },
      update: { name: "Demo Location", city: "Demo City", country: "Demo Country" },
      create: {
        id: `demo_location_${orgSpec.key}`,
        organizationId: org.id,
        name: "Demo Location",
        city: "Demo City",
        country: "Demo Country",
      },
    });
    await prisma.department.upsert({
      where: { id: `demo_department_${orgSpec.key}` },
      update: { name: "Demo Department" },
      create: {
        id: `demo_department_${orgSpec.key}`,
        organizationId: org.id,
        name: "Demo Department",
      },
    });
  }
}

async function seedCatalog() {
  const serviceSlugs = servicesCatalog.map((service) => service.slug);
  for (let i = 0; i < servicesCatalog.length; i++) {
    const service = servicesCatalog[i];
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {
        name: service.name.en,
        shortDescription: service.short.en,
        description: service.description.en,
        benefits: service.benefits.map((item) => item.en),
        features: service.problems.map((item) => item.en),
        process: service.process.map((item) => item.en),
        isActive: true,
        isFeatured: i < 6,
        order: i,
        price: null,
      },
      create: {
        id: `demo_service_${service.slug}`,
        slug: service.slug,
        name: service.name.en,
        shortDescription: service.short.en,
        description: service.description.en,
        benefits: service.benefits.map((item) => item.en),
        features: service.problems.map((item) => item.en),
        process: service.process.map((item) => item.en),
        isActive: true,
        isFeatured: i < 6,
        order: i,
        price: null,
      },
    });
  }
  await prisma.service.updateMany({
    where: { slug: { notIn: [...serviceSlugs, "it-technical-support", "computer-troubleshooting", "hardware-maintenance", "software-installation", "network-setup", "remote-support", "web-design", "it-consulting", "cybersecurity", "system-optimization"] } },
    data: { isActive: false },
  });

  const categoryNames = Array.from(new Set(servicesCatalog.map((service) => service.category.en)));
  const categoryIds: Record<string, string> = {};
  for (let i = 0; i < categoryNames.length; i++) {
    const slug = slugify(categoryNames[i]);
    const category = await prisma.serviceCategory.upsert({
      where: { slug },
      update: { name: categoryNames[i], order: i, isActive: true },
      create: { id: `demo_service_category_${slug}`, name: categoryNames[i], slug, order: i },
    });
    categoryIds[categoryNames[i]] = category.id;
  }
  for (const service of servicesCatalog) {
    await prisma.service.update({
      where: { slug: service.slug },
      data: { categoryId: categoryIds[service.category.en] },
    });
  }

  for (let i = 0; i < solutionsCatalog.length; i++) {
    const solution = solutionsCatalog[i];
    await prisma.solution.upsert({
      where: { slug: solution.slug },
      update: {
        title: solution.title.en,
        description: solution.description.en,
        content: solution.content.en,
        order: i,
        isActive: true,
      },
      create: {
        id: `demo_solution_${solution.slug}`,
        slug: solution.slug,
        title: solution.title.en,
        description: solution.description.en,
        content: solution.content.en,
        order: i,
      },
    });
  }
  await prisma.solution.updateMany({
    where: { slug: { notIn: solutionsCatalog.map((item) => item.slug) } },
    data: { isActive: false },
  });

  for (let i = 0; i < industriesCatalog.length; i++) {
    const industry = industriesCatalog[i];
    await prisma.industry.upsert({
      where: { slug: industry.slug },
      update: {
        name: industry.name.en,
        description: industry.description.en,
        challenges: industry.challenges.map((item) => item.en),
        solutions: industry.solutions.map((item) => item.en),
        order: i,
        isActive: true,
      },
      create: {
        id: `demo_industry_${industry.slug}`,
        slug: industry.slug,
        name: industry.name.en,
        description: industry.description.en,
        challenges: industry.challenges.map((item) => item.en),
        solutions: industry.solutions.map((item) => item.en),
        order: i,
      },
    });
  }
  await prisma.industry.updateMany({
    where: { slug: { notIn: industriesCatalog.map((item) => item.slug) } },
    data: { isActive: false },
  });

  const productCategoryIds: Record<string, string> = {};
  for (let i = 0; i < productCategories.length; i++) {
    const category = productCategories[i];
    const record = await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name.en, description: category.description.en, order: i, isActive: true },
      create: {
        id: `demo_product_category_${category.slug}`,
        slug: category.slug,
        name: category.name.en,
        description: category.description.en,
        order: i,
      },
    });
    productCategoryIds[category.slug] = record.id;
  }

  const extraProducts = [
    { slug: "demo-monitor", categorySlug: "laptops-computers", name: "Display Monitor", description: "A general display profile. Size and model are confirmed in the quote." },
    { slug: "demo-headset", categorySlug: "computer-accessories", name: "Headset", description: "A general headset profile. Model is confirmed in the quote." },
    { slug: "demo-network-cable", categorySlug: "networking-equipment", name: "Network Cable", description: "Cabling is quoted after the site requirement is known." },
    { slug: "demo-usb-drive", categorySlug: "storage-devices", name: "USB Drive", description: "Capacity and price are confirmed in the quote." },
    { slug: "demo-scanner", categorySlug: "printers-peripherals", name: "Scanner", description: "A general scanner profile. Model is confirmed in the quote." },
    { slug: "demo-network-switch-profile", categorySlug: "security-equipment", name: "Managed Switch Profile", description: "Port count and model depend on the network assessment." },
    { slug: "demo-license-consultation", categorySlug: "software-licenses", name: "License Consultation", description: "Licensing is confirmed with the vendor path you choose." },
  ];

  const allProducts = [
    ...productCatalog.map((product) => ({
      slug: product.slug,
      categorySlug: product.categorySlug,
      name: product.name.en,
      description: product.description.en,
    })),
    ...extraProducts,
  ];

  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        categoryId: productCategoryIds[product.categorySlug],
        specifications: [],
        availability: "On request",
        isActive: true,
        order: i,
      },
      create: {
        id: `demo_product_${product.slug}`,
        slug: product.slug,
        name: product.name,
        description: product.description,
        categoryId: productCategoryIds[product.categorySlug],
        specifications: [],
        availability: "On request",
        isActive: true,
        order: i,
      },
    });
  }
  await prisma.product.updateMany({
    where: { slug: { notIn: allProducts.map((item) => item.slug) } },
    data: { isActive: false },
  });

  const planSlugs = ["demo-plan-basic", "demo-plan-professional", "demo-plan-business"];
  const plans = [
    { slug: planSlugs[0], name: "Demo Basic", description: "Demo plan skeleton — no approved price. Do not publish.", features: ["Support request submission", "Portal access"] },
    { slug: planSlugs[1], name: "Demo Professional", description: "Demo plan skeleton — no approved price. Do not publish.", features: ["Support request submission", "Portal access", "Asset view"] },
    { slug: planSlugs[2], name: "Demo Business", description: "Demo plan skeleton — no approved price. Do not publish.", features: ["Support request submission", "Portal access", "Asset view", "Reports view"] },
  ];
  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        features: plan.features,
        priceMonthly: 0,
        priceYearly: 0,
        isActive: false,
        maxTickets: null,
        maxUsers: null,
      },
      create: {
        id: `demo_plan_${i + 1}`,
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        features: plan.features,
        priceMonthly: 0,
        priceYearly: 0,
        isActive: false,
      },
    });
  }
  await prisma.subscriptionPlan.updateMany({
    where: { slug: { notIn: planSlugs } },
    data: { isActive: false },
  });

  const faqs = [
    { question: "How do I submit a support request?", answer: "Sign in to the customer portal and open a support ticket.", category: "Support" },
    { question: "Can I track my request?", answer: "Yes. Ticket status and replies are available in the portal.", category: "Support" },
    { question: "Are product prices listed on the site?", answer: "No. Configuration and pricing are confirmed in a written quotation.", category: "Billing" },
    { question: "How is remote support started?", answer: "Only after you request it and approve the session.", category: "Support" },
    { question: "Do you publish customer names or certifications?", answer: "Only verified references may be published. Unverified claims are not shown.", category: "Company" },
    { question: "Which languages does the platform support?", answer: "Arabic and English, with RTL and LTR layouts.", category: "Platform" },
  ];
  for (let i = 0; i < faqs.length; i++) {
    await prisma.fAQ.create({
      data: { id: `demo_faq_${i + 1}`, ...faqs[i], order: i, isActive: true },
    });
  }

  await prisma.systemSetting.upsert({
    where: { key: "company_name" },
    update: { value: "ShadTech" },
    create: { id: "demo_setting_company_name", key: "company_name", value: "ShadTech" },
  });
  await prisma.systemSetting.upsert({
    where: { key: "tagline_en" },
    update: { value: "Technology That Works. Support You Can Trust." },
    create: { id: "demo_setting_tagline_en", key: "tagline_en", value: "Technology That Works. Support You Can Trust." },
  });
  await prisma.systemSetting.upsert({
    where: { key: "tagline_ar" },
    update: { value: "تقنية تعمل بكفاءة. ودعم يمكنك الاعتماد عليه." },
    create: { id: "demo_setting_tagline_ar", key: "tagline_ar", value: "تقنية تعمل بكفاءة. ودعم يمكنك الاعتماد عليه." },
  });

  return { serviceSlugs, planSlugs };
}

async function seedOperations(
  services: Array<{ slug: string }>,
  plans: Array<{ slug: string }>,
  users: Record<string, { id: string }>,
  profiles: Array<{ id: string; userId: string }>,
) {
  const allProfiles = profiles;
  const serviceRecords = await Promise.all(
    services.map((service) => prisma.service.findUniqueOrThrow({ where: { slug: service.slug } })),
  );
  const planRecords = await Promise.all(
    plans.map((plan) => prisma.subscriptionPlan.findUniqueOrThrow({ where: { slug: plan.slug } })),
  );
  const agents = [users.admin.id, users.agent1.id, users.agent2.id];

  for (let i = 0; i < 12; i++) {
    const profile = allProfiles[i % allProfiles.length];
    await prisma.serviceRequest.upsert({
      where: { id: `demo_request_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_request_${String(i + 1).padStart(2, "0")}`,
        customerId: profile.id,
        serviceId: serviceRecords[i % serviceRecords.length].id,
        message: "Demo service request record.",
        status: i % 3 === 0 ? "COMPLETED" : "PENDING",
        createdAt: dateFromNow(-i, 10),
      },
    });
  }

  const ticketSubjects = [
    "Laptop will not start",
    "Wi-Fi disconnects repeatedly",
    "Software installation request",
    "Slow computer performance",
    "Printer is offline",
    "Email setup assistance",
    "Password reset assistance",
    "Network cable fault",
    "Backup verification request",
    "Security review request",
    "Website update request",
    "Cloud account setup",
  ];
  const statuses = [
    TicketStatus.OPEN,
    TicketStatus.IN_PROGRESS,
    TicketStatus.WAITING_FOR_CUSTOMER,
    TicketStatus.RESOLVED,
    TicketStatus.CLOSED,
  ];
  const priorities = [TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.CRITICAL];

  for (let i = 0; i < 32; i++) {
    const id = `demo_ticket_${String(i + 1).padStart(2, "0")}`;
    const customer = allProfiles[i % allProfiles.length];
    const status = statuses[i % statuses.length];
    await prisma.supportTicket.upsert({
      where: { id },
      update: {},
      create: {
        id,
        ticketNumber: `DEMO-TKT-${String(i + 1).padStart(4, "0")}`,
        customerId: customer.id,
        assignedToId: agents[i % agents.length],
        subject: `${ticketSubjects[i % ticketSubjects.length]} (demo ${String(i + 1).padStart(2, "0")})`,
        description: "Demo ticket created to exercise the support workspace. Replace with real intake data in production.",
        status,
        priority: priorities[i % priorities.length],
        category: i % 2 === 0 ? "Hardware" : "Software",
        createdAt: dateFromNow(-i, 8 + (i % 8)),
        resolvedAt: status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED ? dateFromNow(-i + 2) : null,
        closedAt: status === TicketStatus.CLOSED ? dateFromNow(-i + 3) : null,
      },
    });

    await prisma.ticketMessage.create({
      data: {
        id: `demo_message_${String(i + 1).padStart(2, "0")}_1`,
        ticketId: id,
        authorId: customer.userId,
        body: "Demo customer message describing the issue.",
        createdAt: dateFromNow(-i, 8),
      },
    });
    await prisma.ticketMessage.create({
      data: {
        id: `demo_message_${String(i + 1).padStart(2, "0")}_2`,
        ticketId: id,
        authorId: agents[i % agents.length],
        body: "Demo agent acknowledgement and next step.",
        isInternal: false,
        createdAt: dateFromNow(-i, 9),
      },
    });
    if (i % 4 === 0) {
      await prisma.ticketMessage.create({
        data: {
          id: `demo_message_${String(i + 1).padStart(2, "0")}_3`,
          ticketId: id,
          authorId: agents[i % agents.length],
          body: "Demo internal note for support staff only.",
          isInternal: true,
          createdAt: dateFromNow(-i, 10),
        },
      });
    }
    await prisma.ticketActivityLog.create({
      data: {
        id: `demo_activity_${String(i + 1).padStart(2, "0")}`,
        ticketId: id,
        actorId: agents[i % agents.length],
        action: "CREATED",
        details: "Demo ticket seeded",
        createdAt: dateFromNow(-i, 8),
      },
    });
  }

  for (let i = 0; i < 12; i++) {
    const profile = allProfiles[i % allProfiles.length];
    const subscriptionId = `demo_subscription_${String(i + 1).padStart(2, "0")}`;
    await prisma.subscription.upsert({
      where: { id: subscriptionId },
      update: {},
      create: {
        id: subscriptionId,
        customerId: profile.id,
        planId: planRecords[i % planRecords.length].id,
        status: i % 5 === 0 ? SubscriptionStatus.PAST_DUE : SubscriptionStatus.ACTIVE,
        period: i % 3 === 0 ? BillingPeriod.YEARLY : BillingPeriod.MONTHLY,
        startDate: dateFromNow(-60 + i),
        endDate: dateFromNow(305 + i),
        autoRenew: true,
      },
    });

    const invoiceId = `demo_invoice_${String(i + 1).padStart(2, "0")}`;
    const amount = [49, 99, 199][i % 3];
    await prisma.invoice.upsert({
      where: { id: invoiceId },
      update: {},
      create: {
        id: invoiceId,
        customerId: profile.id,
        subscriptionId,
        number: `DEMO-INV-${String(i + 1).padStart(4, "0")}`,
        amount,
        status: i % 4 === 0 ? InvoiceStatus.PENDING : InvoiceStatus.PAID,
        dueDate: dateFromNow(14 + i),
        paidAt: i % 4 === 0 ? null : dateFromNow(-i),
        createdAt: dateFromNow(-30 + i),
      },
    });

    if (i % 4 !== 0) {
      await prisma.payment.upsert({
        where: { id: `demo_payment_${String(i + 1).padStart(2, "0")}` },
        update: {},
        create: {
          id: `demo_payment_${String(i + 1).padStart(2, "0")}`,
          invoiceId,
          amount,
          status: PaymentStatus.SUCCESS,
          method: "Demo record",
          reference: `DEMO-PAY-${String(i + 1).padStart(4, "0")}`,
          createdAt: dateFromNow(-i),
        },
      });
    }
  }
}

async function seedEnterprise(
  users: Record<string, { id: string }>,
  profiles: Array<{ id: string; userId: string }>,
) {
  const agents = [users.admin.id, users.agent1.id, users.agent2.id];

  for (let i = 0; i < 20; i++) {
    const id = `demo_asset_${String(i + 1).padStart(2, "0")}`;
    await prisma.asset.upsert({
      where: { id },
      update: {},
      create: {
        id,
        assetTag: `DEMO-AST-${String(i + 1).padStart(4, "0")}`,
        name: `Demo Asset ${String(i + 1).padStart(2, "0")}`,
        type: ["Laptop", "Desktop", "Switch", "Access Point", "Printer"][i % 5],
        manufacturer: "Not specified",
        model: "Not specified",
        serialNumber: `DEMO-SN-${String(i + 1).padStart(4, "0")}`,
        status: i % 7 === 0 ? AssetStatus.UNDER_MAINTENANCE : AssetStatus.IN_USE,
        purchaseDate: dateFromNow(-400 + i),
        warrantyExpires: dateFromNow(365 + i),
        location: "Demo Location",
        assignedUserId: i % 3 === 0 ? profiles[i % profiles.length].userId : agents[i % agents.length],
        customerId: i % 2 === 0 ? profiles[(i + 10) % profiles.length].id : null,
        notes: "Demo ITAM record; no verified purchase or warranty details.",
      },
    });
    if (i < 5) {
      await prisma.assetHistory.create({
        data: {
          id: `demo_asset_history_${String(i + 1).padStart(2, "0")}`,
          assetId: id,
          action: "CREATED",
          details: "Demo asset record created",
          actorId: agents[0],
        },
      });
    }
  }

  const ciIds = Array.from({ length: 8 }, (_, i) => `demo_ci_${String(i + 1).padStart(2, "0")}`);
  for (let i = 0; i < ciIds.length; i++) {
    await prisma.configurationItem.upsert({
      where: { id: ciIds[i] },
      update: {},
      create: {
        id: ciIds[i],
        name: `Demo Configuration Item ${String(i + 1).padStart(2, "0")}`,
        type: ["Service", "Server", "Network", "Application", "Database"][i % 5],
        description: "Demo CMDB record.",
        status: "ACTIVE",
        ownerId: agents[i % agents.length],
        location: "Demo Location",
      },
    });
  }
  for (let i = 1; i < ciIds.length; i++) {
    await prisma.cIRelation.create({
      data: {
        id: `demo_ci_relation_${String(i).padStart(2, "0")}`,
        fromId: ciIds[i],
        toId: ciIds[0],
        type: "DEPENDS_ON",
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    await prisma.problem.upsert({
      where: { id: `demo_problem_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_problem_${String(i + 1).padStart(2, "0")}`,
        title: `Demo Problem ${String(i + 1).padStart(2, "0")}`,
        description: "Demo ITSM problem record.",
        rootCause: i % 2 === 0 ? "Under demo investigation" : null,
        workaround: i % 2 === 0 ? "Use the documented demo workaround" : null,
        status: i % 2 === 0 ? "OPEN" : "CLOSED",
        priority: i % 3 === 0 ? "HIGH" : "MEDIUM",
        createdById: agents[i % agents.length],
      },
    });
    await prisma.changeRequest.upsert({
      where: { id: `demo_change_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_change_${String(i + 1).padStart(2, "0")}`,
        title: `Demo Change ${String(i + 1).padStart(2, "0")}`,
        description: "Demo change request record.",
        risk: i % 2 === 0 ? "LOW" : "MEDIUM",
        status: i % 2 === 0 ? "APPROVED" : "DRAFT",
        implementationPlan: "Demo implementation plan",
        rollbackPlan: "Demo rollback plan",
        scheduledAt: dateFromNow(i + 1),
        createdById: agents[i % agents.length],
      },
    });
  }

  for (let i = 0; i < 3; i++) {
    await prisma.release.upsert({
      where: { id: `demo_release_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_release_${String(i + 1).padStart(2, "0")}`,
        name: `Demo Release ${String(i + 1).padStart(2, "0")}`,
        version: `0.${i + 1}.0-demo`,
        description: "Demo release record.",
        status: i === 0 ? "COMPLETED" : "PLANNED",
        scheduledAt: dateFromNow(i + 3),
      },
    });
    await prisma.sLAPolicy.upsert({
      where: { id: `demo_sla_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_sla_${String(i + 1).padStart(2, "0")}`,
        name: `Demo SLA ${String(i + 1).padStart(2, "0")}`,
        responseMinutes: [30, 60, 240][i],
        resolutionMinutes: [240, 480, 1440][i],
        businessHoursOnly: i !== 0,
      },
    });
  }

  for (let i = 0; i < 8; i++) {
    await prisma.lead.upsert({
      where: { id: `demo_lead_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_lead_${String(i + 1).padStart(2, "0")}`,
        name: `Demo Lead ${String(i + 1).padStart(2, "0")}`,
        email: `lead${i + 1}@demo.local`,
        phone: "+000 000 0000",
        company: `Demo Prospect ${String(i + 1).padStart(2, "0")}`,
        source: "Demo",
        status: i % 3 === 0 ? "QUALIFIED" : "NEW",
        ownerId: agents[i % agents.length],
        notes: "Demo CRM record.",
      },
    });
  }

  for (let i = 0; i < 6; i++) {
    await prisma.opportunity.upsert({
      where: { id: `demo_opportunity_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_opportunity_${String(i + 1).padStart(2, "0")}`,
        name: `Demo Opportunity ${String(i + 1).padStart(2, "0")}`,
        value: 1000 * (i + 1),
        stage: ["NEW_LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION"][i % 4],
        ownerId: agents[i % agents.length],
        customerId: profiles[i % profiles.length].id,
      },
    });
    await prisma.quotation.upsert({
      where: { id: `demo_quote_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_quote_${String(i + 1).padStart(2, "0")}`,
        number: `DEMO-QUO-${String(i + 1).padStart(4, "0")}`,
        customerId: profiles[i % profiles.length].id,
        total: 1000 * (i + 1),
        status: i % 2 === 0 ? "SENT" : "DRAFT",
        validUntil: dateFromNow(30),
      },
    });
    await prisma.contract.upsert({
      where: { id: `demo_contract_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_contract_${String(i + 1).padStart(2, "0")}`,
        number: `DEMO-CON-${String(i + 1).padStart(4, "0")}`,
        customerId: profiles[i % profiles.length].id,
        title: `Demo Support Contract ${String(i + 1).padStart(2, "0")}`,
        status: i === 0 ? ContractStatus.EXPIRED : ContractStatus.ACTIVE,
        value: 1000 * (i + 1),
        startDate: dateFromNow(-100 + i),
        endDate: dateFromNow(265 + i),
        notes: "Demo contract record.",
      },
    });
    await prisma.appointment.upsert({
      where: { id: `demo_appointment_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_appointment_${String(i + 1).padStart(2, "0")}`,
        customerId: profiles[i % profiles.length].id,
        assigneeId: agents[i % agents.length],
        title: `Demo Consultation ${String(i + 1).padStart(2, "0")}`,
        startsAt: dateFromNow(i + 1, 10),
        endsAt: dateFromNow(i + 1, 11),
        status: i === 0 ? AppointmentStatus.COMPLETED : AppointmentStatus.SCHEDULED,
        location: "Demo / Remote",
        notes: "Demo appointment record.",
      },
    });
  }

  for (let i = 0; i < 6; i++) {
    await prisma.expense.upsert({
      where: { id: `demo_expense_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_expense_${String(i + 1).padStart(2, "0")}`,
        description: `Demo Expense ${String(i + 1).padStart(2, "0")}`,
        amount: 50 * (i + 1),
        category: "Demo Operations",
        status: i % 3 === 0 ? ExpenseStatus.PENDING : ExpenseStatus.APPROVED,
        expenseDate: dateFromNow(-10 + i),
        vendor: "Demo Vendor",
        recordedById: agents[0],
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    const projectId = `demo_project_${String(i + 1).padStart(2, "0")}`;
    await prisma.project.upsert({
      where: { id: projectId },
      update: {},
      create: {
        id: projectId,
        name: `Demo Project ${String(i + 1).padStart(2, "0")}`,
        description: "Demo project record.",
        status: i === 4 ? "COMPLETED" : "ACTIVE",
        ownerId: agents[i % agents.length],
        startDate: dateFromNow(-30 + i),
        endDate: dateFromNow(30 + i),
      },
    });
    for (let taskIndex = 0; taskIndex < 3; taskIndex++) {
      await prisma.task.upsert({
        where: { id: `demo_task_${String(i + 1).padStart(2, "0")}_${taskIndex + 1}` },
        update: {},
        create: {
          id: `demo_task_${String(i + 1).padStart(2, "0")}_${taskIndex + 1}`,
          projectId,
          title: `Demo Task ${i + 1}.${taskIndex + 1}`,
          description: "Demo task record.",
          status: taskIndex === 0 ? "DONE" : "TODO",
          priority: taskIndex === 0 ? "LOW" : "MEDIUM",
          assigneeId: agents[(i + taskIndex) % agents.length],
          dueDate: dateFromNow(taskIndex + 1),
        },
      });
    }
  }
}

async function seedKnowledgeAndSystem(
  users: Record<string, { id: string }>,
  profiles: Array<{ id: string; userId: string }>,
) {
  const authors = [users.admin.id, users.agent1.id, users.content.id];

  const kbTopics = [
    ["Getting started with the customer portal", "Account access", "Sign in, review the dashboard, and open a support ticket."],
    ["How ticket status works", "Support", "Open, in progress, waiting for customer, resolved, and closed."],
    ["Preparing a support request", "Support", "Include the device, the symptom, and when the problem started."],
    ["Safe password habits", "Security", "Use unique passwords and enable two-factor authentication where available."],
    ["Checking network connectivity", "Network", "Confirm the connection, restart the router, and test another device."],
    ["Backing up important files", "Resilience", "Keep at least one separate copy of important work."],
    ["Software licensing basics", "Procurement", "Confirm licence rights before installation."],
    ["Asset records and warranty dates", "ITAM", "Review asset tags, assigned users, and warranty expiry."],
    ["Understanding SLAs", "ITSM", "Response and resolution targets are defined by policy."],
    ["Working with the AI assistant", "Platform", "The assistant requires a configured model provider and never replaces a support agent."],
  ] as const;

  for (let i = 0; i < kbTopics.length; i++) {
    const [title, category, content] = kbTopics[i];
    await prisma.knowledgeArticle.upsert({
      where: { id: `demo_kb_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_kb_${String(i + 1).padStart(2, "0")}`,
        slug: `demo-kb-${String(i + 1).padStart(2, "0")}`,
        title,
        category,
        content,
        tags: ["demo", slugify(category)],
        isPublished: true,
        authorId: authors[i % authors.length],
      },
    });
  }

  for (let i = 0; i < 3; i++) {
    await prisma.blogPost.upsert({
      where: { id: `demo_blog_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_blog_${String(i + 1).padStart(2, "0")}`,
        slug: `demo-article-${String(i + 1).padStart(2, "0")}`,
        title: `Demo Article ${String(i + 1).padStart(2, "0")}`,
        excerpt: "Unpublished demo content. Replace with reviewed material before publishing.",
        content: "This is a demo article placeholder and is intentionally not published.",
        authorId: users.content.id,
        isPublished: false,
      },
    });
  }

  const workflows = [
    ["New ticket notification", "TICKET_CREATED", "Notify assigned agent", "SEND_NOTIFICATION"],
    ["High priority escalation", "TICKET_PRIORITY_HIGH", "Escalate to support lead", "CREATE_TASK"],
    ["Resolved ticket follow-up", "TICKET_RESOLVED", "Ask customer for confirmation", "SEND_NOTIFICATION"],
    ["New lead assignment", "LEAD_CREATED", "Assign to available owner", "ASSIGN_OWNER"],
  ] as const;
  for (let i = 0; i < workflows.length; i++) {
    const [name, trigger, conditions, actions] = workflows[i];
    await prisma.workflow.upsert({
      where: { id: `demo_workflow_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_workflow_${String(i + 1).padStart(2, "0")}`,
        name,
        trigger,
        conditions,
        actions,
        isEnabled: true,
      },
    });
  }

  for (let i = 0; i < 3; i++) {
    await prisma.announcement.upsert({
      where: { id: `demo_announcement_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_announcement_${String(i + 1).padStart(2, "0")}`,
        title: `Demo Announcement ${String(i + 1).padStart(2, "0")}`,
        body: "Demo announcement record. Replace with verified company news before publishing.",
        isActive: false,
        startsAt: dateFromNow(-i),
      },
    });
  }

  for (let i = 0; i < 8; i++) {
    const userId = i < 3 ? profiles[i].userId : users.agent1.id;
    await prisma.notification.upsert({
      where: { id: `demo_notification_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_notification_${String(i + 1).padStart(2, "0")}`,
        userId,
        title: `Demo Notification ${String(i + 1).padStart(2, "0")}`,
        body: "Demo notification record.",
        type: "INFO",
        link: "/dashboard/tickets",
        isRead: i % 3 === 0,
        createdAt: dateFromNow(-i),
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    await prisma.auditLog.upsert({
      where: { id: `demo_audit_${String(i + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `demo_audit_${String(i + 1).padStart(2, "0")}`,
        actorId: users.admin.id,
        action: `demo:action_${i + 1}`,
        entity: "demo",
        entityId: `demo_${i + 1}`,
        details: "Demo audit record",
        ipAddress: "127.0.0.1",
        createdAt: dateFromNow(-i),
      },
    });
  }

  for (let i = 0; i < 3; i++) {
    const assessmentId = `demo_assessment_${String(i + 1).padStart(2, "0")}`;
    await prisma.iTAssessment.upsert({
      where: { id: assessmentId },
      update: {},
      create: {
        id: assessmentId,
        customerId: profiles[i].id,
        email: "demo@demo.local",
        companyName: i === 0 ? "Demo Business" : null,
        companySize: i === 0 ? "1-10" : null,
        employees: 5 + i,
        computers: 8 + i,
        score: 50 + i * 10,
        summary: "Demo assessment record.",
        createdAt: dateFromNow(-i),
      },
    });
    await prisma.iTAssessmentAnswer.create({
      data: {
        id: `demo_assessment_answer_${String(i + 1).padStart(2, "0")}`,
        assessmentId,
        question: "Do you have a documented backup process?",
        answer: "Demo answer",
      },
    });
  }

  for (let i = 0; i < 3; i++) {
    const sessionId = `demo_chat_${String(i + 1).padStart(2, "0")}`;
    await prisma.chatSession.upsert({
      where: { id: sessionId },
      update: {},
      create: {
        id: sessionId,
        customerId: profiles[i].id,
        agentId: users.agent1.id,
        status: i === 0 ? "CLOSED" : "OPEN",
        createdAt: dateFromNow(-i),
      },
    });
    await prisma.chatMessage.create({
      data: {
        id: `demo_chat_message_${String(i + 1).padStart(2, "0")}_1`,
        sessionId,
        senderId: profiles[i].userId,
        body: "Demo customer chat message.",
        createdAt: dateFromNow(-i),
      },
    });
    await prisma.chatMessage.create({
      data: {
        id: `demo_chat_message_${String(i + 1).padStart(2, "0")}_2`,
        sessionId,
        senderId: users.agent1.id,
        body: "Demo agent chat reply.",
        createdAt: dateFromNow(-i),
      },
    });
  }

  for (let i = 0; i < 2; i++) {
    const conversationId = `demo_chat_ai_${String(i + 1).padStart(2, "0")}`;
    await prisma.aIConversation.upsert({
      where: { id: conversationId },
      update: {},
      create: {
        id: conversationId,
        userId: profiles[i].userId,
        title: `Demo AI conversation ${i + 1}`,
        createdAt: dateFromNow(-i),
      },
    });
    await prisma.aIMessage.create({
      data: {
        id: `demo_ai_message_${String(i + 1).padStart(2, "0")}_1`,
        conversationId,
        role: "user",
        content: "Demo question",
        createdAt: dateFromNow(-i),
      },
    });
    await prisma.aIMessage.create({
      data: {
        id: `demo_ai_message_${String(i + 1).padStart(2, "0")}_2`,
        conversationId,
        role: "assistant",
        content: "Demo answer. Live AI requires a configured model provider.",
        createdAt: dateFromNow(-i),
      },
    });
  }
}

async function main() {
  console.log("Seeding ShadTech demo data (idempotent)...");
  await resetDemoData();
  const { users, individualProfiles, businessProfiles } = await seedUsers();
  await seedOrganizations(users, businessProfiles);
  const { serviceSlugs, planSlugs } = await seedCatalog();
  const profiles = [...individualProfiles, ...businessProfiles];
  await seedOperations(
    serviceSlugs.map((slug) => ({ slug })),
    planSlugs.map((slug) => ({ slug })),
    users,
    profiles,
  );
  await seedEnterprise(users, profiles);
  await seedKnowledgeAndSystem(users, profiles);

  console.log("Demo seed complete. All demo records are prefixed DEMO/demo and must be replaced with verified data before production.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
