// Authentication template and documentation types.
export interface AuthVariant {
  id: string;
  title: string;
  description: string;
  isDefault?: boolean;
}

// The kind of template file, used to display its badge in the UI.
export type TemplateFileKind =
  | "core"
  | "optional-ui"
  | "db-adapter";

// A file included in an authentication template.
export interface TemplateFile {
  path: string;
  name: string;
  content: string;
  kind: TemplateFileKind;
}

// Documentation for a function included in an auth implementation.
export interface FunctionDoc {
  name: string;
  description: string;
  signature: string;
  example?: string;
}

// Documentation for a database adapter method.
export interface DbAdapterMethodDoc {
  name: string;
  description: string;
  signature: string;
  example?: string;
}

// HTTP methods supported by an API payload contract.
export type ApiHttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

// Describes the request or response body of an API endpoint.
export interface ApiPayloadShape {
  description?: string;
  example?: Record<string, unknown>;
  typeDefinition?: string;
}

// Documents the request and response contract of an API endpoint.
export interface ApiPayloadContract {
  endpoint: string;
  method: ApiHttpMethod;
  description: string;
  request?: ApiPayloadShape;
  response?: ApiPayloadShape;
}

// Documentation for an individual template file.
export interface FileDoc {
  path: string;
  description: string;
  required: boolean;
}

// Documentation for an environment variable.
export interface EnvironmentVariableDoc {
  name: string;
  description: string;
  required: boolean;
  example?: string;
}

// A security note relevant to the implementation.
export interface SecurityNote {
  title: string;
  description: string;
}

// Structured documentation for a template variant.
export interface TemplateDocumentation {
  overview: string;
  files: FileDoc[];
  functions: FunctionDoc[];
  environmentVariables: EnvironmentVariableDoc[];
  securityNotes: SecurityNote[];
}

// Database adapters supported by the authentication templates.
export type DatabaseAdapterId =
  | "neon"
  | "mongodb"
  | "mysql"
  | "supabase";

// Documentation and code examples for a database adapter.
export interface DatabaseAdapterExample {
  id: DatabaseAdapterId;
  label: string;
  description: string;
  packageName: string;
  envVariables: string[];
  setup: string;
  code: string;
  implemented: boolean;
}
