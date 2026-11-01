import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Code2, Database, Layers3 } from "lucide-react";
import { FaGithub } from "react-icons/fa";

const highlights = [
  { label: "17 auth methods", Icon: Code2 },
  { label: "Multiple frameworks", Icon: Layers3 },
  { label: "Database agnostic", Icon: Database },
];

export function Hero() {
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL;

  return (
    <section className="relative isolate flex h-[calc(100svh-4rem)] min-h-0 items-center overflow-hidden bg-[#08070e] max-md:items-start">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_88%_45%,rgba(91,33,182,0.17),transparent_42%),linear-gradient(180deg,#090711_0%,#08070e_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 max-md:inset-x-0 max-md:bottom-0 max-md:top-[180px]">
        <Image
          src="/auth-banner.png"
          alt=""
          fill
          priority
          className="object-cover hidden lg:block"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-[5] bg-[linear-gradient(90deg,#08070e_0%,rgba(8,7,14,0.97)_25%,rgba(8,7,14,0.78)_43%,rgba(8,7,14,0.08)_72%,rgba(8,7,14,0.02)_100%)] max-md:bg-[linear-gradient(180deg,#08070e_0%,rgba(8,7,14,0.98)_38%,rgba(8,7,14,0.62)_66%,rgba(8,7,14,0.12)_100%)]" />

      <div className="hero-enter mx-auto w-full max-w-7xl px-5 py-4 sm:px-8 md:py-8">
        <div className="mb-6 inline-flex items-center gap-2.5 text-[10px] font-bold tracking-[0.16em] text-violet-300">
          <span className="hero-pulse size-1.5 rounded-full bg-violet-400 shadow-[0_0_13px_#a78bfa]" />
          THE AUTHENTICATION STARTER CATALOG
        </div>

        <h1 className="max-w-[550px] text-[clamp(42px,5.1vw,60px)] font-extrabold leading-[1.055] tracking-[-0.065em] text-zinc-50">
          Auth boilerplates,
          <br />
          <span className="bg-gradient-to-r from-violet-300 via-violet-500 to-violet-300 bg-clip-text text-transparent">
            ready for your next project.
          </span>
        </h1>

        <p className="mt-6 max-w-[550px] text-sm leading-7 text-zinc-300 sm:text-base">
          Explore, inspect, and download reusable authentication implementations.
          From email and password to OAuth, passkeys, and enterprise SSO.
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {highlights.map(({ label, Icon }) => (
            <span key={label} className="inline-flex items-center gap-2 rounded-full border border-violet-300/10 bg-[#161225]/75 px-3.5 py-2.5 text-xs text-zinc-300 backdrop-blur-xl">
              <Icon size={16} className="text-violet-300" /> {label}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/#credentials" className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-700 px-5 text-sm font-bold text-white shadow-[0_8px_30px_rgba(109,40,217,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_38px_rgba(109,40,217,0.4)]">
            Browse boilerplates <ArrowRight size={17} />
          </Link>
          <a href={githubUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2.5 rounded-xl border border-violet-400/35 bg-[#0f0c19]/70 px-5 text-sm font-semibold text-zinc-200 transition hover:-translate-y-0.5 hover:border-violet-300/70">
            <FaGithub size={18} /> Star on GitHub <ArrowRight size={14} />
          </a>
        </div>

        <p className="mt-8 flex max-w-sm items-center gap-2 text-[11px] leading-relaxed text-zinc-500">
          <span className="size-1.5 shrink-0 rounded-full bg-violet-500 shadow-[0_0_10px_#8b5cf6]" />
          Open source · No platform database · Your stack, your choice
        </p>
      </div>
    </section>
  );
}
