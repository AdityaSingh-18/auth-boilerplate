export const authCategories = [
  {
    id: "credentials",
    title: "Credentials",
    description: "Traditional authentication using user-provided credentials.",
    icon: "key-round",
  },
  {
    id: "passwordless",
    title: "Passwordless",
    description: "Authenticate users without requiring a traditional password.",
    icon: "mail",
  },
  {
    id: "social",
    title: "Social",
    description: "Authenticate users through third-party identity providers.",
    icon: "users",
  },
  {
    id: "modern",
    title: "Modern",
    description: "Modern authentication methods such as passkeys and guest access.",
    icon: "fingerprint",
  },
  {
    id: "enterprise-sso",
    title: "Enterprise SSO",
    description: "Enterprise identity federation and single sign-on protocols.",
    icon: "building-2",
  },
] as const;

export type AuthCategory = (typeof authCategories)[number];

export type AuthCategoryId = AuthCategory["id"];

export type AuthMethodStatus = "available" | "planned";

export const authMethods = [
  // Credentials (3)
  {
    id: "email-password",
    title: "Email & Password",
    description: "Authenticate users using their email address and password.",
    categoryId: "credentials",
    icon: "mail",
    iconType: "lucide",
    status: "available",
  },
  {
    id: "username-password",
    title: "Username & Password",
    description: "Authenticate users using a unique username and password.",
    categoryId: "credentials",
    icon: "user-round",
    iconType: "lucide",
    status: "available",
  },
  {
    id: "phone-password",
    title: "Phone & Password",
    description: "Authenticate users using their phone number and password.",
    categoryId: "credentials",
    icon: "smartphone",
    iconType: "lucide",
    status: "available",
  },

  // Passwordless (3)
  {
    id: "email-otp",
    title: "Email OTP",
    description: "Authenticate users using a one-time password sent to their email.",
    categoryId: "passwordless",
    icon: "mail-check",
    iconType: "lucide",
    status: "available",
  },
  {
    id: "magic-link",
    title: "Magic Link",
    description: "Authenticate users through a single-use link sent to their email.",
    categoryId: "passwordless",
    icon: "link",
    iconType: "lucide",
    status: "available",
  },
  {
    id: "sms-otp",
    title: "Phone / SMS OTP",
    description: "Authenticate users using a one-time password sent via SMS.",
    categoryId: "passwordless",
    icon: "message-square",
    iconType: "lucide",
    status: "available",
  },

  // Social (7)
  {
    id: "google-oauth",
    title: "Google Login",
    description: "Authenticate users through their Google account using OAuth 2.0.",
    categoryId: "social",
    icon: "google",
    iconType: "simple",
    status: "available",
  },
  {
    id: "github-oauth",
    title: "GitHub Login",
    description: "Authenticate users through their GitHub account.",
    categoryId: "social",
    icon: "github",
    iconType: "simple",
    status: "available",
  },
  {
    id: "discord-oauth",
    title: "Discord Login",
    description: "Authenticate users through their Discord account.",
    categoryId: "social",
    icon: "discord",
    iconType: "simple",
    status: "available",
  },
  {
    id: "microsoft-oauth",
    title: "Microsoft Login",
    description: "Authenticate users through Microsoft identity services.",
    categoryId: "social",
    icon: "microsoft",
    iconType: "simple",
    status: "available",
  },
  {
    id: "apple-oauth",
    title: "Apple Login",
    description: "Authenticate users through their Apple account.",
    categoryId: "social",
    icon: "apple",
    iconType: "simple",
    status: "available",
  },
  {
    id: "facebook-oauth",
    title: "Facebook Login",
    description: "Authenticate users through their Facebook account.",
    categoryId: "social",
    icon: "facebook",
    iconType: "simple",
    status: "available",
  },
  {
    id: "x-oauth",
    title: "X (Twitter) Login",
    description: "Authenticate users through X using OAuth 2.0.",
    categoryId: "social",
    icon: "x",
    iconType: "simple",
    status: "available",
  },

  // Modern (2)
  {
    id: "passkeys",
    title: "Passkeys / WebAuthn",
    description: "Authenticate users with public-key credentials using WebAuthn.",
    categoryId: "modern",
    icon: "fingerprint",
    iconType: "lucide",
    status: "available",
  },
  {
    id: "guest-login",
    title: "Guest / Anonymous Login",
    description: "Create temporary anonymous sessions without requiring registration.",
    categoryId: "modern",
    icon: "user-round-plus",
    iconType: "lucide",
    status: "available",
  },

  // Enterprise SSO (2)
  {
    id: "oidc-sso",
    title: "OIDC Single Sign-On",
    description: "Authenticate users through OpenID Connect identity providers.",
    categoryId: "enterprise-sso",
    icon: "shield-check",
    iconType: "lucide",
    status: "available",
  },
  {
    id: "saml-sso",
    title: "SAML 2.0 Single Sign-On",
    description: "Authenticate users through enterprise SAML identity providers.",
    categoryId: "enterprise-sso",
    icon: "building-2",
    iconType: "lucide",
    status: "available",
  },
] as const satisfies readonly {
  id: string;
  title: string;
  description: string;
  categoryId: AuthCategoryId;
  icon: string;
  iconType: "lucide" | "simple";
  status: AuthMethodStatus;
}[];

export type AuthMethod = (typeof authMethods)[number];

// Find an authentication method by its unique ID.
export function getAuthMethodById(id: string): AuthMethod | undefined {
  return authMethods.find((method) => method.id === id);
}

// Get all authentication methods belonging to a category.
export function getAuthMethodsByCategory(
  categoryId: AuthCategoryId,
): AuthMethod[] {
  return authMethods.filter((method) => method.categoryId === categoryId);
}
