import {
  AlertTriangle,
  FileCode2,
  FileText,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import type { TemplateDocumentation } from "@/types/auth";

interface FileOverviewProps {
  documentation: TemplateDocumentation;
}

export function FileOverview({
  documentation,
}: FileOverviewProps) {
  return (
    <section className="mt-12 space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Implementation guide
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
          Understanding this implementation
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          {documentation.overview}
        </p>
      </div>

      {/* File overview */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-violet-300" />
          <h3 className="text-base font-semibold text-white">
            File overview
          </h3>
        </div>

        <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          {documentation.files.map((file) => (
            <div
              key={file.path}
              className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex min-w-0 gap-3">
                <FileCode2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />

                <div className="min-w-0">
                  <p className="break-all font-mono text-xs text-zinc-200">
                    {file.path}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    {file.description}
                  </p>
                </div>
              </div>

              <span
                className={`w-fit shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  file.required
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-violet-500/10 text-violet-300"
                }`}
              >
                {file.required ? "Required" : "Optional"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Function documentation */}
      {documentation.functions.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-violet-300" />
            <h3 className="text-base font-semibold text-white">
              Function documentation
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {documentation.functions.map((fn) => (
              <article
                key={fn.name}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <h4 className="font-mono text-sm text-violet-300">
                  {fn.name}
                </h4>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {fn.description}
                </p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-zinc-300">
                  <code>{fn.signature}</code>
                </pre>
                {fn.example && (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-zinc-300">
                    <code>{fn.example}</code>
                  </pre>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Environment variables */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-violet-300" />
          <h3 className="text-base font-semibold text-white">
            Environment variables
          </h3>
        </div>

        {documentation.environmentVariables.length > 0 ? (
          <div className="space-y-3">
            {documentation.environmentVariables.map((variable) => (
              <div
                key={variable.name}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-sm text-violet-300">
                    {variable.name}
                  </code>
                  <span className="text-[10px] uppercase text-zinc-500">
                    {variable.required ? "Required" : "Optional"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  {variable.description}
                </p>
                {variable.example && (
                  <code className="mt-2 block text-xs text-zinc-500">
                    {variable.example}
                  </code>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-400">
            No environment variables are documented yet. They will be listed
            when the full authentication implementation is added.
          </p>
        )}
      </div>

      {/* Security notes */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-violet-300" />
          <h3 className="text-base font-semibold text-white">
            Security notes
          </h3>
        </div>

        <div className="space-y-3">
          {documentation.securityNotes.map((note) => (
            <div
              key={note.title}
              className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">
                  {note.title}
                </h4>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  {note.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
