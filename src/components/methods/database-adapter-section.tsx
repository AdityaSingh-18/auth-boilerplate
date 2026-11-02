import { databaseAdapters } from "@/data/template-docs/email-password-adapters";
import { getLanguageFromPath, highlightCode } from "@/lib/shiki";
import { DatabaseAdapterTabs } from "./database-adapter-tabs";

export async function DatabaseAdapterSection() {
  const adapters = await Promise.all(
    databaseAdapters.map(async (adapter) => ({
      ...adapter,
      highlightedCode: await highlightCode(
        adapter.code,
        getLanguageFromPath("auth-db.ts"),
      ),
    })),
  );

  return <DatabaseAdapterTabs adapters={adapters} />;
}
