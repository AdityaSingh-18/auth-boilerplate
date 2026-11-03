import type {
  TemplateDocumentation,
  DatabaseAdapterExample,
} from "@/types/auth";

import { emailPasswordDocumentation } from "./email-password";
import { emailPasswordAdapters } from "./email-password-adapters";

import { usernamePasswordDocumentation } from "./username-password";
import { usernamePasswordAdapters } from "./username-password-adapters";

import { phonePasswordDocumentation } from "./phone-password";
import { phonePasswordAdapters } from "./phone-password-adapters";

import { emailOtpDocumentation } from "./email-otp";
import { emailOtpAdapters } from "./email-otp-adapters";

export interface MethodDocumentation {
  documentation?: TemplateDocumentation;
  databaseAdapters?: DatabaseAdapterExample[];
  hasApiContracts?: boolean;
}

export const methodDocumentation: Record<string, MethodDocumentation> = {
  "email-password": {
    documentation: emailPasswordDocumentation,
    databaseAdapters: emailPasswordAdapters,
    hasApiContracts: true,
  },

  "username-password": {
    documentation: usernamePasswordDocumentation,
    databaseAdapters: usernamePasswordAdapters,
    hasApiContracts: true,
  },

  "phone-password": {
    documentation: phonePasswordDocumentation,
    databaseAdapters: phonePasswordAdapters,
    hasApiContracts: true,
  },

  "email-otp": {
    documentation: emailOtpDocumentation,
    databaseAdapters: emailOtpAdapters,
    hasApiContracts: true,
  },
};
