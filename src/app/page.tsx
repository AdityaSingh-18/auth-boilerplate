import { Hero } from "@/components/layout/hero";

export default function HomePage() {
  return (
    <>
      <Hero />
      <section id="catalog" className="mx-auto max-w-7xl border-t border-white/[0.08] px-5 py-20 sm:px-8">
        <p className="text-[10px] font-bold tracking-[0.16em] text-violet-300">THE CATALOG</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          Your authentication starting point.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-400">
          Browse reusable implementations by authentication method.
        </p>
      </section>
    </>
  );
}
