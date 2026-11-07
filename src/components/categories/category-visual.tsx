import {
  ArrowRight,
  Check,
  Fingerprint,
  KeyRound,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

import type { AuthCategoryId } from "@/data/auth-methods";
import { categoryContent } from "@/data/category-content";

interface CategoryVisualProps {
  categoryId: AuthCategoryId;
}

function VisualFrame({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        aria-hidden="true"
        className="absolute -inset-5 rounded-[2rem] bg-violet-500/[0.08] blur-3xl"
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#100e19] shadow-2xl shadow-black/30">
        <div className="flex items-center gap-2 border-b border-white/[0.08] px-5 py-4">
          <span className="size-2 rounded-full bg-red-400/70" />
          <span className="size-2 rounded-full bg-yellow-400/70" />
          <span className="size-2 rounded-full bg-green-400/70" />

          <span className="ml-auto text-[10px] font-medium tracking-wide text-zinc-500">
            {label}
          </span>
        </div>

        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

function CredentialsVisual() {
  return (
    <VisualFrame label="CREDENTIALS">
      <div className="mx-auto max-w-xs">
        <div className="mb-6 flex justify-center">
          <div className="grid size-12 place-items-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
            <KeyRound size={23} />
          </div>
        </div>

        <h3 className="text-center text-lg font-semibold text-white">
          Welcome back
        </h3>

        <p className="mt-2 text-center text-xs text-zinc-500">
          Sign in to your account
        </p>

        <div className="mt-7 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">
              Email address
            </p>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-xs text-zinc-500">
              you@example.com
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">
              Password
            </p>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-xs tracking-[0.3em] text-zinc-500">
              ••••••••••
            </div>
          </div>

          <div className="rounded-lg bg-violet-500 px-4 py-3 text-center text-xs font-semibold text-white">
            Sign in
          </div>
        </div>

        <p className="mt-5 text-center text-[10px] text-zinc-600">
          Secure credential authentication
        </p>
      </div>
    </VisualFrame>
  );
}

function PasswordlessVisual() {
  return (
    <VisualFrame label="PASSWORDLESS">
      <div className="mx-auto max-w-xs">
        <div className="mb-6 flex justify-center">
          <div className="grid size-12 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <Mail size={23} />
          </div>
        </div>

        <h3 className="text-center text-lg font-semibold text-white">
          Check your inbox
        </h3>

        <p className="mt-2 text-center text-xs leading-5 text-zinc-500">
          Enter the verification code sent to your email.
        </p>

        <div className="mt-8 flex justify-center gap-2">
          {["4", "8", "2", "6", "1", "9"].map((digit, index) => (
            <div
              key={index}
              className={`grid size-10 place-items-center rounded-lg border text-sm font-semibold ${
                index === 0
                  ? "border-violet-400/50 bg-violet-500/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-zinc-300"
              }`}
            >
              {digit}
            </div>
          ))}
        </div>

        <div className="mt-7 rounded-lg bg-violet-500 px-4 py-3 text-center text-xs font-semibold text-white">
          Verify code
        </div>

        <p className="mt-5 text-center text-[10px] text-zinc-600">
          Verification codes expire after a limited time.
        </p>
      </div>
    </VisualFrame>
  );
}

function SocialVisual() {
  return (
    <VisualFrame label="SOCIAL OAUTH">
      <div className="mx-auto max-w-xs">
        <div className="mb-6 flex justify-center">
          <div className="grid size-12 place-items-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-blue-300">
            <ShieldCheck size={23} />
          </div>
        </div>

        <h3 className="text-center text-lg font-semibold text-white">
          Sign in to continue
        </h3>

        <p className="mt-2 text-center text-xs text-zinc-500">
          Choose your identity provider
        </p>

        <div className="mt-7 space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="grid size-6 place-items-center rounded-full bg-white text-black">
              <span className="text-xs font-bold">G</span>
            </span>
            <span className="flex-1 text-xs font-medium text-zinc-300">
              Continue with Google
            </span>
            <ArrowRight size={14} className="text-zinc-600" />
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
            <FaGithub size={19} className="text-white" />
            <span className="flex-1 text-xs font-medium text-zinc-300">
              Continue with GitHub
            </span>
            <ArrowRight size={14} className="text-zinc-600" />
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="grid size-6 place-items-center rounded-full bg-[#5865F2] text-[10px] font-bold text-white">
              D
            </span>
            <span className="flex-1 text-xs font-medium text-zinc-300">
              Continue with Discord
            </span>
            <ArrowRight size={14} className="text-zinc-600" />
          </div>
        </div>

        <p className="mt-5 text-center text-[10px] text-zinc-600">
          External identity provider authentication
        </p>
      </div>
    </VisualFrame>
  );
}

function ModernVisual() {
  return (
    <VisualFrame label="PASSKEY AUTH">
      <div className="mx-auto max-w-xs">
        <div className="mb-6 flex justify-center">
          <div className="grid size-16 place-items-center rounded-3xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
            <Fingerprint size={36} strokeWidth={1.5} />
          </div>
        </div>

        <h3 className="text-center text-lg font-semibold text-white">
          Sign in with a passkey
        </h3>

        <p className="mt-2 text-center text-xs leading-5 text-zinc-500">
          Use your device's built-in authentication to continue.
        </p>

        <div className="mt-7 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <Smartphone size={21} className="text-violet-300" />

          <div className="flex-1">
            <p className="text-xs font-medium text-zinc-200">
              This device
            </p>
            <p className="mt-1 text-[10px] text-zinc-500">
              Passkey available
            </p>
          </div>

          <Check size={16} className="text-green-400" />
        </div>

        <div className="mt-5 rounded-lg bg-violet-500 px-4 py-3 text-center text-xs font-semibold text-white">
          Continue with passkey
        </div>
      </div>
    </VisualFrame>
  );
}

function EnterpriseVisual() {
  return (
    <VisualFrame label="ENTERPRISE SSO">
      <div className="mx-auto max-w-xs">
        <div className="mb-6 flex justify-center">
          <div className="grid size-12 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
            <ShieldCheck size={23} />
          </div>
        </div>

        <h3 className="text-center text-lg font-semibold text-white">
          Organization sign in
        </h3>

        <p className="mt-2 text-center text-xs leading-5 text-zinc-500">
          Continue through your organization's identity provider.
        </p>

        <div className="mt-7 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-medium text-zinc-500">
            ORGANIZATION DOMAIN
          </p>

          <p className="mt-2 text-sm font-medium text-zinc-200">
            company.example
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] p-3">
          <ShieldCheck size={18} className="text-emerald-300" />

          <div className="flex-1">
            <p className="text-xs font-medium text-zinc-200">
              Identity provider
            </p>
            <p className="mt-1 text-[10px] text-zinc-500">
              Federated authentication
            </p>
          </div>

          <Check size={15} className="text-emerald-400" />
        </div>

        <div className="mt-5 rounded-lg bg-violet-500 px-4 py-3 text-center text-xs font-semibold text-white">
          Continue with SSO
        </div>
      </div>
    </VisualFrame>
  );
}

const categoryVisuals: Record<
  AuthCategoryId,
  React.ComponentType
> = {
  credentials: CredentialsVisual,
  passwordless: PasswordlessVisual,
  social: SocialVisual,
  modern: ModernVisual,
  "enterprise-sso": EnterpriseVisual,
};

export function CategoryVisual({
  categoryId,
}: CategoryVisualProps) {
  const Visual = categoryVisuals[categoryId];
  const content = categoryContent[categoryId];

  return (
    <section
      aria-label={content.visualLabel}
      className="relative"
    >
      <div className="mb-5 text-center">
        <p className="text-xs font-semibold text-violet-300">
          {content.visualLabel}
        </p>
        <p className="mt-1 text-[11px] text-zinc-500">
          {content.visualDescription}
        </p>
      </div>

      <div className="animate-in fade-in duration-700">
        <Visual />
      </div>
    </section>
  );
}
