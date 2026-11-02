import type { TemplateFile } from "@/types/auth";
import { getLanguageFromPath, highlightCode } from "@/lib/shiki";
import { FileExplorer } from "./file-explorer";

interface SourceCodeSectionProps {
  files: TemplateFile[];
}

export async function SourceCodeSection({
  files,
}: SourceCodeSectionProps) {
  if (files.length === 0) return null;

  const highlightedFiles = await Promise.all(
    files.map(async (file) => {
      const language = getLanguageFromPath(file.path);

      return {
        path: file.path,
        name: file.name,
        kind: file.kind,
        language,
        highlightedCode: await highlightCode(file.content, language),
      };
    }),
  );

  return (
    <section className="mt-12">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Source code
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
          Explore the implementation
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Browse the template files and inspect their implementation.
        </p>
      </div>

      <FileExplorer files={highlightedFiles} />
    </section>
  );
}
