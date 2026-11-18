import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { translateKey } from "@/lib/dictionaries";
import { getServerDictionary } from "@/lib/server-i18n";

export async function SectionCard({
  titleKey,
  descriptionKey,
  children,
}: {
  titleKey: string;
  descriptionKey?: string;
  children: React.ReactNode;
}) {
  const t = await getServerDictionary();
  return (
    <Card className="border-[#E4E7EC] shadow-sm dark:border-white/10">
      <CardHeader>
        <CardTitle className="text-base">{translateKey(t, titleKey) ?? titleKey}</CardTitle>
        {descriptionKey && (
          <p className="text-sm text-muted-foreground">{translateKey(t, descriptionKey) ?? descriptionKey}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
