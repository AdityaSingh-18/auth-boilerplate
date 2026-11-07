import type { AuthCategoryId } from "@/data/auth-methods";

export interface CategoryFeature {
  title: string;
  description: string;
}

export interface CategoryContent {
  eyebrow: string;
  title: string;
  description: string;
  introduction: string;
  visualLabel: string;
  visualDescription: string;
  features: CategoryFeature[];
}

export const categoryContent: Record<AuthCategoryId, CategoryContent> = {
  credentials: {
    eyebrow: "TRADITIONAL AUTHENTICATION",
    title: "Authentication built around credentials.",
    description:
      "Explore reusable email, username, and phone-based authentication implementations with secure password handling and session management.",
    introduction:
      "Credential-based authentication remains a practical foundation for applications that need direct control over registration, login, and user accounts. Explore implementations that you can inspect, customize, and integrate into your own project.",
    visualLabel: "Credential authentication",
    visualDescription:
      "A preview of a traditional sign-in experience.",
    features: [
      {
        title: "Flexible login identifiers",
        description:
          "Explore authentication using email addresses, usernames, or phone numbers.",
      },
      {
        title: "Password security",
        description:
          "Understand password hashing, verification, and secure credential handling.",
      },
      {
        title: "Session management",
        description:
          "Explore session creation, authentication checks, and logout workflows.",
      },
    ],
  },

  passwordless: {
    eyebrow: "PASSWORD-FREE AUTHENTICATION",
    title: "Let users authenticate without passwords.",
    description:
      "Discover passwordless authentication implementations using email OTP, magic links, and SMS verification.",
    introduction:
      "Passwordless authentication replaces traditional password entry with temporary verification methods. Explore implementations that help you build email verification, one-time password flows, and link-based sign-in experiences.",
    visualLabel: "Passwordless authentication",
    visualDescription:
      "A preview of a one-time verification experience.",
    features: [
      {
        title: "One-time passwords",
        description:
          "Explore time-limited verification codes delivered through email or SMS.",
      },
      {
        title: "Magic link authentication",
        description:
          "Understand single-use sign-in links and callback verification.",
      },
      {
        title: "Temporary verification",
        description:
          "Explore token expiration, single-use verification, and rate limiting.",
      },
    ],
  },

  social: {
    eyebrow: "SOCIAL AUTHENTICATION",
    title: "Connect authentication to trusted providers.",
    description:
      "Explore OAuth implementations for Google, GitHub, Discord, Microsoft, Apple, Facebook, and X.",
    introduction:
      "Social authentication allows users to sign in through identity providers they already use. Explore OAuth implementations, authorization redirects, callback handling, token exchange, and account linking.",
    visualLabel: "Social login",
    visualDescription:
      "A preview of a social identity provider sign-in experience.",
    features: [
      {
        title: "Multiple identity providers",
        description:
          "Explore integrations with popular social and developer platforms.",
      },
      {
        title: "OAuth authorization",
        description:
          "Understand authorization redirects, callback validation, and token exchange.",
      },
      {
        title: "Account linking",
        description:
          "Explore how external provider identities can be associated with application accounts.",
      },
    ],
  },

  modern: {
    eyebrow: "MODERN AUTHENTICATION",
    title: "Explore the next generation of sign-in.",
    description:
      "Discover modern authentication approaches including passkeys, WebAuthn, and guest access.",
    introduction:
      "Modern authentication introduces alternatives to traditional credential-based sign-in. Explore public-key authentication with passkeys and temporary anonymous access for applications that support guest experiences.",
    visualLabel: "Modern authentication",
    visualDescription:
      "A preview of a modern passkey authentication experience.",
    features: [
      {
        title: "Passkey authentication",
        description:
          "Explore public-key credentials and WebAuthn authentication workflows.",
      },
      {
        title: "Biometric experiences",
        description:
          "Understand how compatible devices can provide convenient user verification.",
      },
      {
        title: "Guest access",
        description:
          "Explore temporary anonymous sessions without requiring registration.",
      },
    ],
  },

  "enterprise-sso": {
    eyebrow: "ENTERPRISE IDENTITY",
    title: "Build authentication for enterprise environments.",
    description:
      "Explore enterprise single sign-on implementations using OpenID Connect and SAML 2.0.",
    introduction:
      "Enterprise single sign-on connects applications with external identity providers. Explore identity federation, authorization flows, token validation, and enterprise authentication integration patterns.",
    visualLabel: "Enterprise single sign-on",
    visualDescription:
      "A preview of an enterprise identity provider connection.",
    features: [
      {
        title: "OpenID Connect",
        description:
          "Explore identity federation using OIDC discovery, authorization, and ID tokens.",
      },
      {
        title: "SAML 2.0",
        description:
          "Understand service provider initiated authentication and SAML assertions.",
      },
      {
        title: "Identity federation",
        description:
          "Explore how applications integrate with configured enterprise identity providers.",
      },
    ],
  },
};
