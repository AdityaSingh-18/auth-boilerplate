import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  Link2,
  Mail,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  UserRound,
  UserRoundPlus,
  Users,
  Building2,
} from "lucide-react";

import {
  type AuthMethod,
} from "@/data/auth-methods";

interface CategoryMethodCardProps {
  method: AuthMethod;
}

const methodIcons: Record<string, React.ElementType> = {
  mail: Mail,
  "user-round": UserRound,
  smartphone: Smartphone,
  "mail-check": Mail,
  link: Link2,
  "message-square": MessageSquare,
  fingerprint: Fingerprint,
  "user-round-plus": UserRoundPlus,
  "shield-check": ShieldCheck,
  "building-2": Building2,
  "key-round": KeyRound,
  users: Users,
};

const providerColors: Record<string, string> = {
  "google-oauth": "text-red-300",
  "github-oauth": "text-zinc-200",
  "discord-oauth": "text-indigo-300",
  "microsoft-oauth": "text-sky-300",
  "apple-oauth": "text-zinc-100",
  "facebook-oauth": "text-blue-300",
  "x-oauth": "text-zinc-100",
};

export function CategoryMethodCard({
  method,
}: CategoryMethodCardProps) {
  const Icon = methodIcons[method.icon] ?? ShieldCheck;
  const providerColor = providerColors[method.id];

  return (
    <Link
      href={`/methods/${method.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-violet-500/[0.04] hover:shadow-xl hover:shadow-violet-950/10 sm:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-violet-500/[0.04] blur-3xl transition-colors duration-300 group-hover:bg-violet-500/[0.12]"
      />

      <div className="relative flex items-start justify-between gap-4">
        <div
          className={`grid size-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-300 transition-colors duration-300 group-hover:border-violet-400/20 group-hover:bg-violet-500/10 ${
            providerColor ?? ""
          }`}
        >
          <Icon size={21} strokeWidth={1.8} />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
          <CheckCircle2 size={11} />
          Available
        </span>
      </div>

      <div className="relative mt-6 flex-1">
        <h3 className="text-base font-semibold text-zinc-100 transition-colors group-hover:text-violet-200">
          {method.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {method.description}
        </p>
      </div>

      <div className="relative mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
        <span className="text-xs font-medium text-zinc-400 transition-colors group-hover:text-violet-300">
          Explore implementation
        </span>

        <span className="grid size-8 place-items-center rounded-lg border border-white/[0.08] text-zinc-500 transition-all duration-300 group-hover:border-violet-400/20 group-hover:bg-violet-500/10 group-hover:text-violet-300">
          <ArrowUpRight size={15} />
        </span>
      </div>
    </Link>
  );
}
