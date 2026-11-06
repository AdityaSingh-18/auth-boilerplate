import { authCategories, authMethods } from "@/data/auth-methods";

import { methodDocumentation } from "@/data/template-docs";

export type SearchResultType =
  | "category"
  | "method"
  | "documentation";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  href: string;
  type: SearchResultType;
  group: string;
  keywords: string[];
}

function searchableText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(searchableText).join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value)
      .map(searchableText)
      .join(" ");
  }

  return "";
}

function createDocumentationResult(
  methodId: string,
  id: string,
  title: string,
  description: string,
  group: string,
  keywords: string[] = [],
): SearchResult {
  return {
    id: `${methodId}-${id}`,
    title,
    description,
    href: `/methods/${methodId}`,
    type: "documentation",
    group,
    keywords: [
      methodId,
      title,
      description,
      group,
      ...keywords,
    ],
  };
}

function buildCategoryResults(): SearchResult[] {
  return authCategories.map((category) => ({
    id: `category-${category.id}`,
    title: category.title,
    description: category.description,
    href: `/#${category.id}`,
    type: "category",
    group: "Categories",
    keywords: [
      category.id,
      category.title,
      category.description,
    ],
  }));
}

function buildMethodResults(): SearchResult[] {
  return authMethods.map((method) => {
    const category = authCategories.find(
      (item) => item.id === method.categoryId,
    );

    return {
      id: `method-${method.id}`,
      title: method.title,
      description: method.description,
      href: `/methods/${method.id}`,
      type: "method",
      group: category?.title ?? "Authentication Methods",
      keywords: [
        method.id,
        method.title,
        method.description,
        method.categoryId,
        category?.title ?? "",
        method.icon,
      ],
    };
  });
}

function buildDocumentationResults(): SearchResult[] {
  const results: SearchResult[] = [];

  for (const method of authMethods) {
    const methodDocs = methodDocumentation[method.id];

    if (!methodDocs) {
      continue;
    }

    const documentation = methodDocs.documentation;

    if (documentation) {
      results.push(
        createDocumentationResult(
          method.id,
          "overview",
          `${method.title} Overview`,
          documentation.overview,
          "Overview",
          ["introduction", "implementation", "getting started"],
        ),
      );

      for (const file of documentation.files) {
        results.push(
          createDocumentationResult(
            method.id,
            `file-${file.path}`,
            file.path,
            file.description,
            "Files",
            [
              file.path,
              file.path.split("/").pop() ?? "",
              file.required ? "required" : "optional",
              "source code",
            ],
          ),
        );
      }

      for (const fn of documentation.functions) {
        results.push(
          createDocumentationResult(
            method.id,
            `function-${fn.name}`,
            fn.name,
            fn.description,
            "Functions",
            [
              fn.signature,
              fn.example ?? "",
              "function helper utility",
            ],
          ),
        );
      }

      for (const variable of documentation.environmentVariables) {
        results.push(
          createDocumentationResult(
            method.id,
            `env-${variable.name}`,
            variable.name,
            variable.description,
            "Environment Variables",
            [
              variable.example ?? "",
              variable.required ? "required" : "optional",
              "environment configuration env config",
            ],
          ),
        );
      }

      for (const note of documentation.securityNotes) {
        results.push(
          createDocumentationResult(
            method.id,
            `security-${note.title}`,
            note.title,
            note.description,
            "Security",
            ["security", "protection", "best practices"],
          ),
        );
      }
    }

    for (const adapter of methodDocs.databaseAdapters ?? []) {
      results.push(
        createDocumentationResult(
          method.id,
          `adapter-${adapter.id}`,
          `${adapter.label} Database Adapter`,
          adapter.description,
          "Database Adapters",
          [
            adapter.id,
            adapter.packageName,
            ...adapter.envVariables,
            searchableText(adapter.setup),
            searchableText(adapter.code),
            adapter.implemented ? "implemented" : "example",
            "database storage connection",
          ],
        ),
      );
    }

    for (const contract of methodDocs.apiContracts ?? []) {
      results.push(
        createDocumentationResult(
          method.id,
          `api-${contract.method}-${contract.endpoint}`,
          `${contract.method} ${contract.endpoint}`,
          contract.description,
          "API Contracts",
          [
            contract.method,
            contract.endpoint,
            searchableText(contract.request),
            searchableText(contract.response),
            "api endpoint request response payload",
          ],
        ),
      );
    }
  }

  return results;
}

export const searchIndex: SearchResult[] = [
  ...buildCategoryResults(),
  ...buildMethodResults(),
  ...buildDocumentationResults(),
];

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function searchAuthContent(
  query: string,
  limit = 12,
): SearchResult[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  const queryTerms = normalizedQuery
    .split(/\s+/)
    .filter(Boolean);

  const scoredResults = searchIndex.map((result) => {
    const title = normalizeSearchText(result.title);
    const description = normalizeSearchText(result.description);
    const group = normalizeSearchText(result.group);
    const keywords = normalizeSearchText(
      result.keywords.join(" "),
    );

    const searchable = [
      title,
      description,
      group,
      keywords,
    ].join(" ");

    let score = 0;

    for (const term of queryTerms) {
      if (title === term) {
        score += 20;
      } else if (title.startsWith(term)) {
        score += 12;
      } else if (title.includes(term)) {
        score += 8;
      }

      if (group.includes(term)) {
        score += 5;
      }

      if (keywords.includes(term)) {
        score += 4;
      }

      if (description.includes(term)) {
        score += 3;
      }

      if (!searchable.includes(term)) {
        score -= 10;
      }
    }

    const allTermsMatch = queryTerms.every((term) =>
      searchable.includes(term),
    );

    if (!allTermsMatch) {
      score = 0;
    }

    return {
      result,
      score,
    };
  });

  return scoredResults
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.result);
}
