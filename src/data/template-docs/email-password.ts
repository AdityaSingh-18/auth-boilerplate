import type { TemplateDocumentation } from "@/types/auth";

export const emailPasswordDocumentation: TemplateDocumentation = {
  overview:
    "A headless email and password authentication scaffold for Next.js App Router. It separates authentication operations, database access, API routes, and optional reference UI.",

  files: [
    {
      path: "README.md",
      description:
        "Explains the template structure, included files, and initial setup steps.",
      required: true,
    },
    {
      path: "core/lib/auth.ts",
      description:
        "Reserved for the core email and password authentication operations. Full authentication logic is planned for Phase 5.",
      required: true,
    },
    {
      path: "core/lib/auth-db.ts",
      description:
        "Defines the database adapter boundary used by the authentication layer. Database implementations are planned for Phase 5.",
      required: true,
    },
    {
      path: "core/api/auth/route.ts",
      description:
        "Provides the authentication API route entry point. Full endpoint behavior is planned for Phase 5.",
      required: true,
    },
    {
      path: "optional-ui/AuthForm.tsx",
      description:
        "Provides an optional reference authentication form that can be adapted or replaced with your own UI.",
      required: false,
    },
  ],

  functions: [],

  environmentVariables: [],

  securityNotes: [
    {
      title: "Initial scaffold",
      description:
        "This template does not yet provide complete authentication logic. Do not use it as a production authentication system.",
    },
    {
      title: "Database implementation pending",
      description:
        "A working database adapter and its secure query implementation must be added before the authentication flow can be used.",
    },
    {
      title: "Security review required",
      description:
        "Review password hashing, input validation, rate limiting, session management, and error handling when the full implementation is added.",
    },
  ],
};
