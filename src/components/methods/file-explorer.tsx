"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

type FileTreeNode =
  | {
      type: "folder";
      name: string;
      path: string;
      children: FileTreeNode[];
    }
  | {
      type: "file";
      file: ExplorerFile;
    };

function buildFileTree(files: ExplorerFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  for (const file of files) {
    const segments = file.path.split("/").filter(Boolean);
    let currentLevel = root;
    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath = currentPath
        ? `${currentPath}/${segment}`
        : segment;

      const isFile = index === segments.length - 1;

      if (isFile) {
        currentLevel.push({
          type: "file",
          file,
        });
        return;
      }

      let folder = currentLevel.find(
        (node): node is Extract<FileTreeNode, { type: "folder" }> =>
          node.type === "folder" && node.name === segment,
      );

      if (!folder) {
        folder = {
          type: "folder",
          name: segment,
          path: currentPath,
          children: [],
        };

        currentLevel.push(folder);
      }

      currentLevel = folder.children;
    });
  }

  return root;
}

function getFileCategory(file: ExplorerFile): string {
  const lowerPath = file.path.toLowerCase();
  const lowerName = file.name.toLowerCase();

  if (lowerName === ".env.example") {
    return "Environment";
  }

  if (lowerName === "readme.md") {
    return "Documentation";
  }

  if (
    file.kind === "db-adapter" ||
    lowerPath.endsWith("/auth-db.ts")
  ) {
    return "DB Adapter";
  }

  if (file.kind === "optional-ui") {
    return "Optional Reference UI";
  }

  if (lowerPath.startsWith("core/")) {
    return "Required Core";
  }

  return "Template File";
}

export function FileExplorer({ files }: FileExplorerProps) {
  const tree = useMemo(() => buildFileTree(files), [files]);

  const [activePath, setActivePath] = useState(
    files[0]?.path ?? "",
  );

  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [copyErrorPath, setCopyErrorPath] = useState<string | null>(null);

  // Folders are expanded by default.
  // This state tracks only folders explicitly collapsed by the user.
  const [collapsedFolders, setCollapsedFolders] = useState<string[]>([]);

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Fall back to the first available file if the selected file disappears.
  const activeFile = files.find((file) => file.path === activePath) ?? files[0];

  const currentActivePath = activeFile?.path ?? "";

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  function toggleFolder(folderPath: string) {
    setCollapsedFolders((current) =>
      current.includes(folderPath)
        ? current.filter((path) => path !== folderPath)
        : [...current, folderPath],
    );
  }

  function selectFile(path: string) {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }

    setActivePath(path);
    setCopiedPath(null);
    setCopyErrorPath(null);
  }

  async function handleCopy() {
    if (!activeFile) return;

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopiedPath(activeFile.path);
      setCopyErrorPath(null);
    } catch {
      setCopiedPath(null);
      setCopyErrorPath(activeFile.path);
    }

    copyTimeoutRef.current = setTimeout(() => {
      setCopiedPath(null);
      setCopyErrorPath(null);
      copyTimeoutRef.current = null;
    }, 3000);
  }

  function renderNode(node: FileTreeNode, depth = 0) {
    if (node.type === "file") {
      const file = node.file;
      const isActive = currentActivePath === file.path;
      const isReadme = file.name.toLowerCase() === "readme.md";

      return (
        <button
          key={file.path}
          type="button"
          onClick={() => selectFile(file.path)}
          title={file.path}
          aria-current={isActive ? "page" : undefined}
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

          {getFileCategory(file) === "DB Adapter" && (
            <span className="ml-auto shrink-0 rounded bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-violet-300">
              DB
            </span>
          )}
        </button>
      );
    }

    const isExpanded = !collapsedFolders.includes(node.path);

    return (
      <div key={node.path}>
        <button
          type="button"
          onClick={() => toggleFolder(node.path)}
          aria-expanded={isExpanded}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.04]"
          style={{ paddingLeft: `${8 + depth * 14}px` }}
        >
          {isExpanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-violet-300" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-violet-300" />
          )}

          <span className="truncate">{node.name}/</span>

          <span className="ml-auto text-[10px] text-zinc-600">
            {node.children.length}
          </span>
        </button>

        {isExpanded && (
          <div>
            {node.children.map((child) =>
              renderNode(child, depth + 1),
            )}
          </div>
        )}
      </div>
    );
  }

  if (files.length === 0 || !activeFile) {
    return null;
  }

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
            {tree.map((node) => renderNode(node))}
          </div>
        </aside>

        {/* Main code panel */}
        <div className="min-w-0 flex-1">
          {/* Mobile file selector */}
          <div className="border-b border-white/10 p-3 sm:hidden">
            <label
              htmlFor="mobile-file-selector"
              className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
            >
              Select file
            </label>

            <select
              id="mobile-file-selector"
              value={currentActivePath}
              onChange={(event) => selectFile(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111118] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-violet-400/50"
            >
              {files.map((file) => (
                <option key={file.path} value={file.path}>
                  {file.path}
                </option>
              ))}
            </select>
          </div>

          {/* Existing horizontal tabs */}
          <div className="hidden overflow-x-auto border-b border-white/10 sm:flex">
            {files.map((file) => (
              <button
                key={file.path}
                type="button"
                onClick={() => selectFile(file.path)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors ${
                  currentActivePath === file.path
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
                {getFileCategory(activeFile)}
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
              ) : copyErrorPath === activeFile.path ? (
                <>
                  <Copy className="h-3.5 w-3.5 text-red-400" />
                  Copy failed
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
          {activeFile.name.toLowerCase().endsWith(".md") ? (
            <div className="max-h-[760px] overflow-y-auto overflow-x-hidden p-6">
              <article
                className="prose prose-invert max-w-none
                  prose-headings:font-bold
                  prose-h1:text-3xl
                  prose-h2:text-2xl
                  prose-h3:text-xl
                  prose-p:text-sm
                  prose-li:text-sm
                  prose-a:text-violet-400
                  prose-strong:text-white
                  prose-code:rounded
                  prose-code:bg-white/10
                  prose-code:px-1
                  prose-pre:overflow-x-auto
                "
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeFile.content}
                </ReactMarkdown>
              </article>
            </div>
          ) : (
            <div
              className="max-h-[760px] overflow-y-auto overflow-x-hidden text-[13px] leading-6 
                [&_pre]:!whitespace-pre-wrap [&_pre]:!break-words [&_pre]:min-w-0 [&_pre]:p-5 
                [&_pre]:font-mono [&_code]:!whitespace-pre-wrap [&_code]:!break-words"
              dangerouslySetInnerHTML={{
                __html: activeFile.highlightedCode,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
