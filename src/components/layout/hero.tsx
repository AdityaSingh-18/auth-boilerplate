import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Database,
  Download,
  Folder,
  Layers3,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

const highlights = [
  { label: "17 auth methods", Icon: Code2 },
  { label: "Multiple frameworks", Icon: Layers3 },
  { label: "Database agnostic", Icon: Database },
];

const templateParts = [
  {
    number: "01",
    title: "core/",
    subtitle: "Authentication logic",
    description:
      "The main authentication implementation, including routes, services, validation, and session handling.",
    Icon: Code2,
  },
  {
    number: "02",
    title: "core/lib/auth-db.ts",
    subtitle: "Database adapter",
    description:
      "A clear database interface that separates authentication logic from your application's database implementation.",
    Icon: Database,
  },
  {
    number: "03",
    title: "optional-ui/",
    subtitle: "Reference UI",
    description:
      "Optional frontend examples showing how to connect forms and interface components to the authentication API.",
    Icon: Layers3,
  },
];

export function Hero() {
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL;

  return (
    <>
      {/* Main hero */}
      <section className="relative isolate flex h-[calc(100svh-4rem)] min-h-0 items-center overflow-hidden bg-[#08070e] max-md:items-start">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_88%_45%,rgba(91,33,182,0.17),transparent_42%),linear-gradient(180deg,#090711_0%,#08070e_100%)]" />

        <div className="pointer-events-none absolute inset-0 -z-10 max-md:inset-x-0 max-md:bottom-0 max-md:top-[180px]">
          <Image
            src="/auth-banner.png"
            alt=""
            fill
            priority
            className="hidden object-cover lg:block"
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
            Explore, inspect, and download reusable authentication
            implementations. From email and password to OAuth, passkeys, and
            enterprise SSO.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {highlights.map(({ label, Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-violet-300/10 bg-[#161225]/75 px-3.5 py-2.5 text-xs text-zinc-300 backdrop-blur-xl"
              >
                <Icon size={16} className="text-violet-300" />
                {label}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/#credentials"
              className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-700 px-5 text-sm font-bold text-white shadow-[0_8px_30px_rgba(109,40,217,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_38px_rgba(109,40,217,0.4)]"
            >
              Browse boilerplates
              <ArrowRight size={17} />
            </Link>

            {githubUrl ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center gap-2.5 rounded-xl border border-violet-400/35 bg-[#0f0c19]/70 px-5 text-sm font-semibold text-zinc-200 transition hover:-translate-y-0.5 hover:border-violet-300/70"
              >
                <FaGithub size={18} />
                Star on GitHub
                <ArrowRight size={14} />
              </a>
            ) : null}
          </div>

          <p className="mt-8 flex max-w-sm items-center gap-2 text-[11px] leading-relaxed text-zinc-500">
            <span className="size-1.5 shrink-0 rounded-full bg-violet-500 shadow-[0_0_10px_#8b5cf6]" />
            Open source · No platform database · Your stack, your choice
          </p>
        </div>
      </section>

      {/* Template architecture and download workflow */}
      <section
        id="workflow"
        className="relative overflow-hidden border-y border-white/[0.07] bg-[#0b0913] px-5 py-20 sm:px-8 lg:py-28"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 left-1/2 -z-0 size-[500px] -translate-x-1/2 rounded-full bg-violet-600/[0.07] blur-[140px]"
        />

        <div className="relative z-10 mx-auto max-w-7xl">
          {/* Section heading */}
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-300/[0.06] px-3.5 py-2 text-[10px] font-bold tracking-[0.16em] text-violet-300">
              <Folder size={13} />
              BUILT FOR REUSABILITY
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Everything you need.
              <br />
              <span className="bg-gradient-to-r from-violet-300 to-violet-500 bg-clip-text text-transparent">
                Nothing you don&apos;t.
              </span>
            </h2>

            <p className="mt-5 text-sm leading-7 text-zinc-400 sm:text-base">
              Every authentication boilerplate follows a predictable structure.
              Understand each part, use what you need, and integrate it into
              your own application.
            </p>
          </div>

          {/* Architecture cards */}
          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {templateParts.map(
              ({ number, title, subtitle, description, Icon }) => (
                <article
                  key={number}
                  className="group rounded-2xl border border-white/[0.08] bg-[#11101a]/80 p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-[#171323]"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid size-11 place-items-center rounded-xl border border-violet-400/15 bg-violet-400/[0.08] text-violet-300">
                      <Icon size={21} />
                    </div>

                    <span className="font-mono text-xs text-zinc-600">
                      {number}
                    </span>
                  </div>

                  <h3 className="mt-6 font-mono text-lg font-semibold text-white">
                    {title}
                  </h3>

                  <p className="mt-2 text-xs font-semibold text-violet-300">
                    {subtitle}
                  </p>

                  <p className="mt-4 text-sm leading-7 text-zinc-400">
                    {description}
                  </p>
                </article>
              ),
            )}
          </div>

          {/* Download workflow */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-violet-400/15 bg-gradient-to-br from-[#171126] to-[#100e18] p-6 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-violet-300">
                  <Download size={15} />
                  YOUR IMPLEMENTATION PACKAGE
                </div>

                <h3 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Explore. Inspect. Download. Integrate.
                </h3>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
                  Choose an authentication method and framework variant. Inspect
                  its files, then download the selected implementation as a ZIP
                  package with its original folder structure.
                </p>

                <div className="mt-6 flex flex-wrap gap-3 text-xs text-zinc-400">
                  <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <Folder size={14} className="text-violet-300" />
                    Core files
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <Database size={14} className="text-violet-300" />
                    DB adapter
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <Code2 size={14} className="text-violet-300" />
                    Optional UI
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 lg:items-end">
                <Link
                  href="/#credentials"
                  className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-violet-500 px-5 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition hover:-translate-y-0.5 hover:bg-violet-400"
                >
                  Explore templates
                  <ArrowRight size={17} />
                </Link>

                <p className="text-[11px] text-zinc-500">
                  Select a template to access its package
                </p>
              </div>
            </div>

            {/* Example archive structure */}
            <div className="mt-8 rounded-xl border border-white/[0.07] bg-black/25 p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <span className="text-xs font-semibold text-zinc-300">
                  Example ZIP structure
                </span>

                <span className="rounded-md border border-violet-300/15 bg-violet-300/[0.06] px-2 py-1 font-mono text-[10px] text-violet-300">
                  .zip
                </span>
              </div>

              <div className="mt-4 grid gap-3 font-mono text-xs text-zinc-400 sm:grid-cols-2">
                <p className="flex items-center gap-2">
                  <Folder size={14} className="text-violet-300" />
                  core/
                </p>

                <p className="flex items-center gap-2">
                  <Folder size={14} className="text-violet-300" />
                  optional-ui/
                </p>

                <p className="flex items-center gap-2">
                  <Code2 size={14} className="text-violet-300" />
                  core/lib/auth-db.ts
                </p>

                <p className="flex items-center gap-2">
                  <Code2 size={14} className="text-violet-300" />
                  README.md
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-6 text-zinc-600">
            Each template is maintained as a separate implementation so you can
            take only what your application needs.
          </p>
        </div>
      </section>
    </>
  );
}
