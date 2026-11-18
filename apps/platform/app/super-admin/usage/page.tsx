import { requirePermission } from "@/lib/session";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { PageHeader } from "@/components/workspace/page-header";
import { StatGrid } from "@/components/workspace/stat-grid";
import { prisma } from "@/lib/db";

export default async function SuperAdminUsagePage() {
  await requirePermission("superAdmin.access", "admin");
  const [
    tickets,
    demoTickets,
    assets,
    articles,
    invoices,
    notifications,
    aiConversations,
    attachments,
  ] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { id: { startsWith: "demo_" } } }),
    prisma.asset.count(),
    prisma.knowledgeArticle.count(),
    prisma.invoice.count(),
    prisma.notification.count(),
    prisma.aIConversation.count(),
    prisma.ticketAttachment.count(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader titleKey="superAdmin.usage" descriptionKey="sections.usage" />

      {demoTickets > 0 && <DemoNotice />}

      <StatGrid
        items={[
          { labelKey: "admin.tickets", value: tickets },
          { labelKey: "admin.assets", value: assets },
          { labelKey: "admin.knowledgeBase", value: articles },
          { labelKey: "admin.invoices", value: invoices },
          { labelKey: "common.notifications", value: notifications },
          { labelKey: "support.aiAssistant", value: aiConversations },
          { labelKey: "common.attachments", value: attachments },
        ]}
      />
    </div>
  );
}
