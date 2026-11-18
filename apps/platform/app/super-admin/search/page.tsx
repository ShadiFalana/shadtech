import type { Metadata } from "next";
import { WorkspaceSearch } from "@/components/search/workspace-search";
import { getServerDictionary } from "@/lib/server-i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerDictionary();
  return { title: t.search.title };
}

export default function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  return <WorkspaceSearch basePath="/super-admin/search" searchParams={searchParams} />;
}
