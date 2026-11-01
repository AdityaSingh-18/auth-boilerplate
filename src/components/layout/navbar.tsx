import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { FaGithub } from "react-icons/fa";

const categories = [
  { label: "Credentials", href: "/#credentials" },
  { label: "Passwordless", href: "/#passwordless" },
  { label: "Social", href: "/#social" },
  { label: "Modern", href: "/#modern" },
  { label: "Enterprise SSO", href: "/#enterprise-sso" },
];

export function Navbar() {
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL;

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#090711]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">

        {/* Logo and brand */}
        <Link
          href="/"
          aria-label="Auth Boilerplate home"
          className="group flex shrink-0 items-center gap-1"
        >
          <Image
            src="/logo.png"
            alt="Auth Boilerplate"
            width={32}
            height={32}
            priority
            className="mt-1 rounded-xl object-contain transition-transform duration-300 group-hover:scale-105"
          />

          <div className="leading-tight">
            <p className="text-2xl font-semibold tracking-tight text-white">
              Auth <span className="text-violet-300">Boilerplate</span>
            </p>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav
          aria-label="Authentication categories"
          className="hidden items-center gap-5 lg:flex xl:gap-7"
        >
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="group relative py-2 text-xs font-medium text-zinc-400 transition-colors duration-200 hover:text-white"
            >
              {category.label}

              <span
                aria-hidden="true"
                className="absolute bottom-0 left-1/2 h-[2px] w-full -translate-x-1/2 scale-x-0 rounded-full bg-violet-400 transition-transform duration-300 group-hover:scale-x-100"
              />
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-4 sm:flex">
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-white"
          >
            <FaGithub size={16} />
            GitHub
            <ArrowUpRight size={12} />
          </a>

          <Link
            href="/#credentials"
            className="rounded-lg bg-zinc-100 px-4 py-2.5 text-xs font-bold text-zinc-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
          >
            Explore methods
          </Link>
        </div>

        {/* Mobile menu */}
        <details className="group relative sm:hidden">
          <summary
            aria-label="Open navigation menu"
            className="grid size-10 cursor-pointer list-none place-items-center rounded-lg border border-white/10 text-zinc-300 transition hover:bg-white/5 [&::-webkit-details-marker]:hidden"
          >
            <Menu size={19} />
          </summary>

          <nav
            aria-label="Mobile navigation"
            className="absolute right-0 top-12 grid w-60 gap-1 rounded-xl border border-white/10 bg-[#111019] p-2 shadow-2xl shadow-black/50"
          >
            {categories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                {category.label}
              </Link>
            ))}

            {githubUrl ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center gap-2 border-t border-white/10 px-3 py-3 text-sm text-zinc-300"
              >
                <FaGithub size={16} />
                GitHub
                <ArrowUpRight size={12} />
              </a>
            ) : null}
          </nav>
        </details>
      </div>
    </header>
  );
}
