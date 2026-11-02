"use client";

import { useState } from "react";
import { FileCode2 } from "lucide-react";

interface ExplorerFile {
  path: string;
  name: string;
  kind: string;
  language: string;
  highlightedCode: string;
}

interface FileExplorerProps {
  files: ExplorerFile[];
}

export function FileExplorer({ files }: FileExplorerProps) {
  const [activePath, setActivePath] = useState(files[0]?.path ?? "");

  const activeFile = files.find((file) => file.path === activePath);
  if (files.length === 0 || !activeFile)   return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d12]">
      <div className="flex overflow-x-auto border-b border-white/10">
        {files.map((file) => (
          <button
            key={file.path}
            type="button"
            onClick={() => setActivePath(file.path)}
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

      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <p className="truncate text-xs text-zinc-400">
          {activeFile.path}
        </p>
        <span className="ml-4 shrink-0 text-xs text-violet-300">
          {activeFile.language}
        </span>
      </div>

      <div
        className="overflow-x-auto text-[13px] leading-6 [&_pre]:min-w-full [&_pre]:p-5 [&_pre]:font-mono"
        dangerouslySetInnerHTML={{
          __html: activeFile.highlightedCode,
        }}
      />
    </div>
  );
}
