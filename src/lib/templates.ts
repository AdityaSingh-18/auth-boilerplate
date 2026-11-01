import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import type {
  TemplateFile,
  TemplateFileKind,
} from "@/types/auth";

const TEMPLATES_DIR = path.join(process.cwd(), "templates");

// Validates template identifiers to prevent directory traversal.
function validateId(id: string, label: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error(`Invalid ${label}: "${id}"`);
  }
}

// Determines the badge kind from the file's directory path.
function getFileKind(relativePath: string): TemplateFileKind {
  const segments = relativePath.split(path.sep);

  if (segments.includes("optional-ui")) {
    return "optional-ui";
  }

  if (segments.includes("db-adapter")) {
    return "db-adapter";
  }

  return "core";
}

// Recursively reads files from a directory.
async function readTemplateDirectory(
  directory: string,
  templateRoot: string,
): Promise<TemplateFile[]> {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });

  const files: TemplateFile[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    // Ignore symbolic links to avoid reading outside the template directory.
    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      const nestedFiles = await readTemplateDirectory(
        fullPath,
        templateRoot,
      );

      files.push(...nestedFiles);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const relativePath = path.relative(templateRoot, fullPath);

    const content = await readFile(fullPath, "utf-8");

    files.push({
      path: relativePath.split(path.sep).join("/"),
      name: entry.name,
      content,
      kind: getFileKind(relativePath),
    });
  }

  return files;
}

// Loads all files for a specific authentication method and variant.
export async function loadTemplateFiles(
  methodId: string,
  variantId: string,
): Promise<TemplateFile[]> {
  validateId(methodId, "method ID");
  validateId(variantId, "variant ID");

  const templateRoot = path.join(
    TEMPLATES_DIR,
    methodId,
    variantId,
  );

  try {
    const files = await readTemplateDirectory(
      templateRoot,
      templateRoot,
    );

    return files.sort((a, b) =>
      a.path.localeCompare(b.path),
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error(
        `Template not found for method "${methodId}" and variant "${variantId}".`,
      );
    }

    throw error;
  }
}
