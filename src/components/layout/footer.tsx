import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FaGithub } from "react-icons/fa";

const categories = [
  { label: "Credentials", href: "/#credentials" },
  { label: "Passwordless", href: "/#passwordless" },
  { label: "Social OAuth", href: "/#social" },
  { label: "Modern Auth", href: "/#modern" },
  { label: "Enterprise SSO", href: "/#enterprise-sso" },
];

export function Footer() {
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL;

  return (
    <footer className="border-t border-white/[0.08] bg-[#09080f]">
      <div className="mx-auto max-w-7xl px-5 pb-6 pt-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] lg:gap-16">

          {/* Brand */}
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label="Auth Boilerplate home"
              className="group inline-flex items-center gap-1"
            >
              <Image
                src="/logo.png"
                alt="Auth Boilerplate"
                width={32}
                height={32}
                className="mt-1 rounded-xl object-contain transition-transform duration-300 group-hover:scale-105"
              />

              <div className="leading-tight">
                <p className="text-2xl font-semibold tracking-tight text-white">
                  Auth <span className="text-violet-300">Boilerplate</span>
                </p>
              </div>
            </Link>

            <p className="mt-4 text-[13px] leading-7 text-zinc-500">
              Reusable authentication boilerplates you can explore, inspect,
              download, and integrate into your next project.
            </p>

            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-xs text-violet-300 transition hover:text-white"
            >
              <FaGithub size={15} />
              View source on GitHub
              <ArrowUpRight size={12} />
            </a>
          </div>

          {/* Categories */}
          <div>
            <h2 className="mb-4 text-xs font-bold text-zinc-100">
              Categories
            </h2>

            <ul className="grid gap-3">
              {categories.map((category) => (
                <li key={category.href}>
                  <Link
                    href={category.href}
                    className="text-xs text-zinc-500 transition hover:text-zinc-200"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h2 className="mb-4 text-xs font-bold text-zinc-100">
              Explore
            </h2>

            <ul className="grid gap-3">
              <li>
                <Link
                  href="/"
                  className="text-xs text-zinc-500 transition hover:text-zinc-200"
                >
                  Home
                </Link>
              </li>

              <li>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-zinc-500 transition hover:text-zinc-200"
                >
                  GitHub repository
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.08] pt-5 text-[10px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Auth Boilerplate</span>
          <span>Built for developers, by developers.</span>
        </div>
      </div>
    </footer>
  );
}
