import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDirection, translateKey } from "@/lib/dictionaries";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import { MiniChartClient, type ChartDatum } from "./mini-chart-client";

export type { ChartDatum };

export async function MiniChart({
  titleKey,
  data,
}: {
  titleKey: string;
  data: ChartDatum[];
}) {
  const [t, locale] = await Promise.all([getServerDictionary(), getServerLocale()]);
  const title = translateKey(t, titleKey) ?? titleKey;
  const summary = `${title}: ${data.map((item) => `${item.label} ${item.value}`).join(", ")}`;

  return (
    <Card className="border-[#E4E7EC] shadow-sm dark:border-white/10">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <MiniChartClient
          title={title}
          data={data}
          dir={getDirection(locale)}
          labels={{ noData: t.common.noData, name: t.forms.name, value: t.common.number }}
          summary={summary}
        />
      </CardContent>
    </Card>
  );
}
