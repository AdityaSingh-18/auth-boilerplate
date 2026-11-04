import type {
  TemplateDocumentation,
  DatabaseAdapterExample,
  ApiPayloadContract,
} from "@/types/auth";

import { emailPasswordDocumentation } from "./email-password/email-password";
import { emailPasswordAdapters } from "./email-password/email-password-adapters";
import { emailPasswordApiContracts } from "./email-password/email-password-api";

import { usernamePasswordDocumentation } from "./username-password/username-password";
import { usernamePasswordAdapters } from "./username-password/username-password-adapters";
import { usernamePasswordApiContracts } from "./username-password/username-password-api";

import { phonePasswordDocumentation } from "./phone-password/phone-password";
import { phonePasswordAdapters } from "./phone-password/phone-password-adapters";
import { phonePasswordApiContracts } from "./phone-password/phone-password-api";

import { emailOtpDocumentation } from "./email-otp/email-otp";
import { emailOtpAdapters } from "./email-otp/email-otp-adapters";
import { emailOtpApiContracts } from "./email-otp/email-otp-api";

import { magicLinkDocumentation } from "./magic-link/magic-link";
import { magicLinkAdapters } from "./magic-link/magic-link-adapters";
import { magicLinkApiContracts } from "./magic-link/magic-link-api";

import { smsOtpDocumentation } from "./sms-otp/sms-otp";
import { smsOtpAdapters } from "./sms-otp/sms-otp-adapters";
import { smsOtpApiContracts } from "./sms-otp/sms-otp-api";

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

  "magic-link": {
    documentation: magicLinkDocumentation,
    databaseAdapters: magicLinkAdapters,
    apiContracts: magicLinkApiContracts,
  },

  "sms-otp": {
    documentation: smsOtpDocumentation,
    databaseAdapters: smsOtpAdapters,
    apiContracts: smsOtpApiContracts,
  },
};
