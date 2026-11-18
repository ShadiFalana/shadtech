import { SupportChat } from "@/components/ai/support-chat";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { integrationIsConfigured } from "@/lib/integrations";
import { getServerDictionary } from "@/lib/server-i18n";
import { MessageCircle } from "lucide-react";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const t = await getServerDictionary();
  const assistantEnabled = integrationIsConfigured("openRouter");

  const publicWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const publicPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "";
  const whatsappDigits = (publicWhatsapp || publicPhone).replace(/[^\d]/g, "");
  const whatsappEnabled = integrationIsConfigured("whatsapp") && whatsappDigits.length >= 8;

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA] text-foreground dark:bg-[#20242A] dark:text-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />

      {assistantEnabled && (
        <div className={whatsappEnabled ? "st-has-whatsapp" : undefined}>
          <SupportChat />
        </div>
      )}

      {whatsappEnabled && (
        <div className="fixed bottom-4 z-50 ltr:right-4 rtl:left-4">
          <a
            href={`https://wa.me/${whatsappDigits}`}
            target="_blank"
            rel="noreferrer"
            aria-label={t.public.whatsapp}
            title={t.public.whatsapp}
            className="flex size-14 items-center justify-center rounded-full bg-[#30343B] text-[#FFB15C] shadow-[0_12px_35px_rgba(32,36,42,0.28)] transition-colors hover:bg-[#24272D] hover:text-white focus-brand"
          >
            <MessageCircle className="size-6" aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  );
}
