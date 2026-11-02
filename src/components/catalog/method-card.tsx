import Link from "next/link";
import {
  Apple,
  Building2,
  Fingerprint,
  KeyRound,
  Link as LinkIcon,
  Mail,
  MailCheck,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  UserRound,
  UserRoundPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  SiApple,
  SiDiscord,
  SiFacebook,
  SiGithub,
  SiGoogle,
  SiX,
} from "react-icons/si";
import { FaMicrosoft } from "react-icons/fa";

import type { IconType } from "react-icons";
import {
  authCategories,
  type AuthMethod,
} from "@/data/auth-methods";

const lucideIcons: Record<string, LucideIcon> = {
  apple: Apple,
  "building-2": Building2,
  fingerprint: Fingerprint,
  "key-round": KeyRound,
  link: LinkIcon,
  mail: Mail,
  "mail-check": MailCheck,
  "message-square": MessageSquare,
  "shield-check": ShieldCheck,
  smartphone: Smartphone,
  "user-round": UserRound,
  "user-round-plus": UserRoundPlus,
  users: Users,
};

const brandIcons: Record<string, IconType> = {
  apple: SiApple,
  discord: SiDiscord,
  facebook: SiFacebook,
  github: SiGithub,
  google: SiGoogle,
  microsoft: FaMicrosoft,
  x: SiX,
};

const statusStyles = {
  available: {
    label: "Available",
    className:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  },
  "in-progress": {
    label: "In Progress",
    className:
      "border-amber-400/20 bg-amber-400/10 text-amber-300",
  },
  planned: {
    label: "Planned",
    className:
      "border-zinc-400/20 bg-zinc-400/10 text-zinc-400",
  },
} as const;

interface MethodCardProps {
  method: AuthMethod;
}

export function MethodCard({ method }: MethodCardProps) {
  const category = authCategories.find(
    (item) => item.id === method.categoryId,
  );

  const status = statusStyles[method.status];

  const LucideIconComponent = lucideIcons[method.icon];
  const BrandIcon = brandIcons[method.icon];

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-violet-300 transition-colors group-hover:border-violet-400/20 group-hover:bg-violet-500/10">
          {method.iconType === "simple" && BrandIcon ? (
            <BrandIcon size={21} aria-hidden="true" />
          ) : LucideIconComponent ? (
            <LucideIconComponent size={21} aria-hidden="true" />
          ) : (
            <KeyRound size={21} aria-hidden="true" />
          )}
        </div>

        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-5 flex-1">
        <h3 className="text-base font-semibold text-zinc-100 transition-colors group-hover:text-violet-200">
          {method.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {method.description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
        {category && (
          <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
            {category.title}
          </span>
        )}

        <Link
          href={`/methods/${method.id}`}
          aria-label={`Explore ${method.title}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 transition-colors hover:text-violet-200"
        >
          Explore
          <span
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
