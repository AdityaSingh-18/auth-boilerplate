import { FileCode2 } from "lucide-react";

import type { TemplateFile } from "@/types/auth";
import { getLanguageFromPath, highlightCode } from "@/lib/shiki";

interface SourceCodeSectionProps {
  files: TemplateFile[];
}

export async function SourceCodeSection({
  files,
}: SourceCodeSectionProps) {
  if (files.length === 0) {
    return null;
  }

  const highlightedFiles = await Promise.all(
    files.map(async (file) => ({
      ...file,
      language: getLanguageFromPath(file.path),
      highlightedCode: await highlightCode(
        file.content,
        getLanguageFromPath(file.path),
      ),
    })),
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
          Browse the files included in this authentication template.
        </p>
      </div>

      <div className="space-y-5">
        {highlightedFiles.map((file) => (
          <article
            key={file.path}
            className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d10]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <FileCode2
                  size={16}
                  className="shrink-0 text-violet-300"
                  aria-hidden="true"
                />

                <span className="truncate text-sm font-medium text-zinc-200">
                  {file.path}
                </span>
              </div>

              <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {file.language}
              </span>
            </div>

            <div
              className="overflow-x-auto text-[13px] leading-6 [&_pre]:min-w-full [&_pre]:p-5 [&_pre]:font-mono"
              dangerouslySetInnerHTML={{
                __html: file.highlightedCode,
              }}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
