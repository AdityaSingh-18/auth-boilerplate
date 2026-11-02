"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";

interface ExplorerFile {
  path: string;
  name: string;
  kind: string;
  content: string;
  language: string;
  highlightedCode: string;
}

interface FileExplorerProps {
  files: ExplorerFile[];
}

export function FileExplorer({ files }: FileExplorerProps) {
  const [activePath, setActivePath] = useState(files[0]?.path ?? "");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const [expandedFolders, setExpandedFolders] = useState<string[]>([
    "core",
    "core/api",
    "core/lib",
    "optional-ui",
  ]);

  const activeFile = files.find((file) => file.path === activePath);

  const readmeFiles = files.filter(
    (file) => file.path.toLowerCase() === "readme.md",
  );

  const coreFiles = files.filter(
    (file) => file.path.startsWith("core/"),
  );

  const optionalFiles = files.filter(
    (file) => file.kind === "optional-ui",
  );

  const coreFilesWithoutAdapter = coreFiles.filter(
    (file) => file.path !== "core/lib/auth-db.ts",
  );

  const adapterFiles = coreFiles.filter(
    (file) => file.path === "core/lib/auth-db.ts",
  );

  function toggleFolder(folder: string) {
    setExpandedFolders((current) =>
      current.includes(folder)
        ? current.filter((item) => item !== folder)
        : [...current, folder],
    );
  }

  function selectFile(path: string) {
    setActivePath(path);
    setCopiedPath(null);
  }

  async function handleCopy() {
    if (!activeFile) return;

    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopiedPath(activeFile.path);
    } catch {
      setCopiedPath(null);
    }
  }

  function renderFile(file: ExplorerFile, depth = 0) {
    const isActive = activePath === file.path;
    const isAdapter = file.path === "core/lib/auth-db.ts";
    const isReadme = file.name.toLowerCase() === "readme.md";

    return (
      <button
        key={file.path}
        type="button"
        onClick={() => selectFile(file.path)}
        title={file.path}
        className={`flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors ${
          isActive
            ? "bg-violet-500/10 text-violet-200"
            : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {isReadme ? (
          <FileText className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <FileCode2 className="h-3.5 w-3.5 shrink-0" />
        )}

        <span className="truncate">{file.name}</span>

        {isAdapter && (
          <span className="ml-auto shrink-0 rounded bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-violet-300">
            DB
          </span>
        )}
      </button>
    );
  }

  function renderFolder(
    name: string,
    folderPath: string,
    folderFiles: ExplorerFile[],
    depth = 0,
  ) {
    const isExpanded = expandedFolders.includes(folderPath);

    return (
      <div key={folderPath}>
        <button
          type="button"
          onClick={() => toggleFolder(folderPath)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.04]"
          style={{ paddingLeft: `${8 + depth * 14}px` }}
        >
          {isExpanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-violet-300" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-violet-300" />
          )}

          <span>{name}/</span>
          <span className="ml-auto text-[10px] text-zinc-600">
            {folderFiles.length}
          </span>
        </button>

        {isExpanded && (
          <div>
            {folderFiles.map((file) => renderFile(file, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  if (files.length === 0 || !activeFile) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d12]">
      <div className="flex min-h-[440px]">
        {/* File tree sidebar */}
        <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-[#111118] sm:block">
          <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Explorer
            </span>
            <span className="text-[10px] text-zinc-600">
              {files.length} files
            </span>
          </div>

          <div className="space-y-1 p-2">
            {readmeFiles.map((file) => renderFile(file))}

            {coreFiles.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-zinc-200">
                  <Folder className="h-3.5 w-3.5 text-violet-300" />
                  core/
                  <span className="ml-auto rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
                    REQUIRED
                  </span>
                </div>

                {renderFolder(
                  "api",
                  "core/api",
                  coreFilesWithoutAdapter.filter((file) =>
                    file.path.startsWith("core/api/"),
                  ),
                  1,
                )}

                {renderFolder(
                  "lib",
                  "core/lib",
                  coreFiles.filter((file) =>
                    file.path.startsWith("core/lib/"),
                  ),
                  1,
                )}

                {coreFilesWithoutAdapter
                  .filter(
                    (file) =>
                      !file.path.startsWith("core/api/") &&
                      !file.path.startsWith("core/lib/"),
                  )
                  .map((file) => renderFile(file, 1))}
              </div>
            )}

            {optionalFiles.length > 0 && (
              <div className="pt-2">
                <div className="mb-1 flex items-center gap-2 px-2 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
                  Optional reference UI
                </div>

                {renderFolder(
                  "optional-ui",
                  "optional-ui",
                  optionalFiles,
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main code panel */}
        <div className="min-w-0 flex-1">
          {/* Existing horizontal tabs — kept in the main panel */}
          <div className="flex overflow-x-auto border-b border-white/10">
            {files.map((file) => (
              <button
                key={file.path}
                type="button"
                onClick={() => selectFile(file.path)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors ${
                  activePath === file.path
                    ? "border-violet-400 bg-white/[0.04] text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <FileCode2 className="h-4 w-4" />
                {file.name}
              </button>
            ))}
          </div>

          {/* File toolbar */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-zinc-400">
                {activeFile.path}
              </p>
              <span className="text-[10px] uppercase tracking-wide text-violet-300">
                {activeFile.path === "core/lib/auth-db.ts"
                  ? "DB Adapter"
                  : activeFile.kind === "optional-ui"
                    ? "Optional Reference UI"
                    : activeFile.path.startsWith("core/")
                      ? "Required Core"
                      : "Documentation"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 transition-colors hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
            >
              {copiedPath === activeFile.path ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy file
                </>
              )}
            </button>
          </div>

          {/* Active highlighted code */}
          <div
            className="overflow-x-auto text-[13px] leading-6 [&_pre]:min-w-full [&_pre]:p-5 [&_pre]:font-mono"
            dangerouslySetInnerHTML={{
              __html: activeFile.highlightedCode,
            }}
          />
        </div>
      </div>
    </div>
  );
}
