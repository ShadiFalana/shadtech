import { AIChat } from "@/components/support/ai-chat";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { integrationIsConfigured } from "@/lib/integrations";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import { requireRole } from "@/lib/session";

type ConversationRow = Awaited<ReturnType<typeof loadConversations>>[number];

async function loadConversations(userId: string) {
  return prisma.aIConversation.findMany({
    where: { userId },
    include: { _count: { select: { messages: true } } },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
}

export default async function SupportAIPage() {
  const session = await requireRole(["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"], "staff");
  const t = await getServerDictionary();
  const locale = await getServerLocale();
  const configured = integrationIsConfigured("openRouter");

  const [conversations, demoConversations] = await Promise.all([
    loadConversations(session.user.id),
    prisma.aIConversation.count({
      where: { userId: session.user.id, id: { startsWith: "demo_chat_ai_" } },
    }),
  ]);

  const columns: Column<ConversationRow>[] = [
    { key: "title", headerKey: "forms.title", cell: (row) => <p className="font-medium">{row.title ?? "—"}</p> },
    { key: "messages", headerKey: "forms.message", cell: (row) => row._count.messages },
    { key: "updatedAt", headerKey: "common.updatedAt", cell: (row) => formatDateTime(row.updatedAt, locale) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="support.aiAssistant" />

      {demoConversations > 0 && <DemoNotice />}

      <SectionCard titleKey="integrations.title" descriptionKey="integrations.subtitle">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{t.integrations.openRouter}</p>
            <Badge variant={configured ? "default" : "outline"}>
              {configured ? t.integrations.configured : t.integrations.notConfigured}
            </Badge>
          </div>
          {configured ? (
            <AIChat />
          ) : (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>{t.errors.aiNotConfigured}</p>
              <p>{t.integrations.setupOpenRouter}</p>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard titleKey="sections.history">
        <DataTable rows={conversations} columns={columns} emptyKey="common.noData" />
      </SectionCard>
    </div>
  );
}
