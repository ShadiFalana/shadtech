import { NewTicketForm } from "@/components/portal/new-ticket-form";
import { PageHeader } from "@/components/workspace/page-header";
import { requireCustomerProfile } from "@/lib/session";

export default async function NewTicketPage() {
  await requireCustomerProfile();

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.newTicket" descriptionKey="common.description" />
      <NewTicketForm />
    </div>
  );
}
