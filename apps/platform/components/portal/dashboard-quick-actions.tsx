import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/workspace/section-card";
import { translateKey } from "@/lib/dictionaries";
import { getServerDictionary } from "@/lib/server-i18n";

const actions = [
  { href: "/dashboard/tickets/new", labelKey: "portal.createTicket" },
  { href: "/dashboard/services", labelKey: "portal.requestService" },
  { href: "/dashboard/quotes", labelKey: "portal.quotes" },
  { href: "/dashboard/appointments", labelKey: "portal.appointments" },
];

export async function DashboardQuickActions() {
  const t = await getServerDictionary();
  return (
    <SectionCard titleKey="portal.quickActions">
      <div className="flex flex-col gap-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={buttonVariants({ variant: "outline", className: "justify-start" })}
          >
            {translateKey(t, action.labelKey) ?? action.labelKey}
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
