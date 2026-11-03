import type { DatabaseAdapterExample } from "@/types/auth";
import { getLanguageFromPath, highlightCode } from "@/lib/shiki";
import { DatabaseAdapterTabs } from "./database-adapter-tabs";

interface DatabaseAdapterSectionProps {
  adapters: DatabaseAdapterExample[];
}

export async function DatabaseAdapterSection({
  adapters,
}: DatabaseAdapterSectionProps) {
  const highlightedAdapters = await Promise.all(
    adapters.map(async (adapter) => ({
      ...adapter,
      highlightedCode: await highlightCode(
        adapter.code,
        getLanguageFromPath("auth-db.ts"),
      ),
    })),
  );

  return <DatabaseAdapterTabs adapters={highlightedAdapters} />;
}
