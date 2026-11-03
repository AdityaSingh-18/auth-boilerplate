import type {
  TemplateDocumentation,
  DatabaseAdapterExample,
  ApiPayloadContract,
} from "@/types/auth";

import { emailPasswordDocumentation } from "./email-password";
import { emailPasswordAdapters } from "./email-password-adapters";
import { emailPasswordApiContracts } from "./email-password-api";

import { usernamePasswordDocumentation } from "./username-password";
import { usernamePasswordAdapters } from "./username-password-adapters";
import { usernamePasswordApiContracts } from "./username-password-api";

import { phonePasswordDocumentation } from "./phone-password";
import { phonePasswordAdapters } from "./phone-password-adapters";
import { phonePasswordApiContracts } from "./phone-password-api";

import { emailOtpDocumentation } from "./email-otp";
import { emailOtpAdapters } from "./email-otp-adapters";
import { emailOtpApiContracts } from "./email-otp-api";

export interface MethodDocumentation {
  documentation?: TemplateDocumentation;
  databaseAdapters?: DatabaseAdapterExample[];
  apiContracts?: ApiPayloadContract[];
}

export const methodDocumentation: Record<string, MethodDocumentation> = {
  "email-password": {
    documentation: emailPasswordDocumentation,
    databaseAdapters: emailPasswordAdapters,
    apiContracts: emailPasswordApiContracts,
  },

  "username-password": {
    documentation: usernamePasswordDocumentation,
    databaseAdapters: usernamePasswordAdapters,
    apiContracts: usernamePasswordApiContracts,
  },

  "phone-password": {
    documentation: phonePasswordDocumentation,
    databaseAdapters: phonePasswordAdapters,
    apiContracts: phonePasswordApiContracts,
  },

  "email-otp": {
    documentation: emailOtpDocumentation,
    databaseAdapters: emailOtpAdapters,
    apiContracts: emailOtpApiContracts,
  },
};
