import {
  createHighlighter,
  type BundledLanguage,
  type Highlighter,
  type SpecialLanguage,
} from "shiki";

const THEME = "github-dark";

const LANGUAGES: BundledLanguage[] = [
  "typescript",
  "tsx",
  "javascript",
  "jsx",
  "json",
  "bash",
  "css",
  "markdown",
];

let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [THEME],
      langs: LANGUAGES,
    });
  }

  return highlighterPromise;
}

const languageByExtension: Record<string, BundledLanguage> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  json: "json",
  md: "markdown",
  css: "css",
  sh: "bash",
  bash: "bash",
};

export function getLanguageFromPath(
  filePath: string,
): BundledLanguage | SpecialLanguage {
  const extension = filePath.split(".").pop()?.toLowerCase() ?? "";

  return languageByExtension[extension] ?? "text";
}

export async function highlightCode(
  code: string,
  language: BundledLanguage | SpecialLanguage,
): Promise<string> {
  const highlighter = await getHighlighter();

  return highlighter.codeToHtml(code, {
    lang: language,
    theme: THEME,
  });
}
