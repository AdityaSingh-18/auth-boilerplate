"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  FileText,
  Layers,
  Search,
  X,
} from "lucide-react";

import {
  searchAuthContent,
  type SearchResult,
  type SearchResultType,
} from "@/lib/search/search-index";

const RESULT_ICONS: Record<SearchResultType, typeof Search> = {
  category: Layers,
  method: Search,
  documentation: FileText,
};

const MAX_RESULTS = 12;

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function CommandPalette() {
  const router = useRouter();
  const inputId = useId();
  const listboxId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resultRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const isMounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const results = useMemo(
    () => searchAuthContent(query, MAX_RESULTS),
    [query],
  );

  const groupedResults = useMemo(() => {
    const groups = new Map<string, SearchResult[]>();

    for (const result of results) {
      const existing = groups.get(result.group) ?? [];
      existing.push(result);
      groups.set(result.group, existing);
    }

    return Array.from(groups.entries());
  }, [results]);

  const openPalette = useCallback(() => {
    setQuery("");
    setActiveIndex(0);
    setIsOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);

    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  const navigateToResult = useCallback(
    (result: SearchResult) => {
      closePalette();
      router.push(result.href);
    },
    [closePalette, router],
  );

  // Prevent the page behind the dialog from scrolling.
  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  // Global keyboard shortcuts.
  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      const isShortcut =
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k";

      if (isShortcut) {
        event.preventDefault();

        if (isOpen) {
          closePalette();
        } else {
          openPalette();
        }

        return;
      }

      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        closePalette();
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [closePalette, isOpen, openPalette]);

  // Focus the input after the portal is rendered.
  useEffect(() => {
    if (!isOpen || !isMounted) return;

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isOpen, isMounted]);

  // Keep the active result visible inside the results area.
  useEffect(() => {
    if (!isOpen || results.length === 0) return;

    resultRefs.current[activeIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex, isOpen, results]);

  const handleInputKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((current) =>
        results.length === 0
          ? 0
          : (current + 1) % results.length,
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((current) =>
        results.length === 0
          ? 0
          : (current - 1 + results.length) % results.length,
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const selectedResult = results[activeIndex];

      if (selectedResult) {
        navigateToResult(selectedResult);
      }
    }
  };

  // Keep keyboard focus inside the dialog.
  const handleDialogKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key !== "Tab") return;

    const focusableElements =
      panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );

    if (!focusableElements?.length) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement =
      focusableElements[focusableElements.length - 1];

    if (
      event.shiftKey &&
      document.activeElement === firstElement
    ) {
      event.preventDefault();
      lastElement.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === lastElement
    ) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  let resultIndex = 0;

  const dialog = (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-black/75 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closePalette();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${inputId}-label`}
        onKeyDown={handleDialogKeyDown}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[42rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111018] text-white shadow-[0_25px_100px_rgba(0,0,0,0.75)]"
      >
        {/* Search header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#111018] px-4">
          <Search
            className="h-5 w-5 shrink-0 text-white/50"
            aria-hidden="true"
          />

          <label
            id={`${inputId}-label`}
            htmlFor={inputId}
            className="sr-only"
          >
            Search authentication methods and documentation
          </label>

          <input
            ref={inputRef}
            id={inputId}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={true}
            aria-controls={listboxId}
            aria-activedescendant={
              results[activeIndex]
                ? `${listboxId}-${results[activeIndex].id}`
                : undefined
            }
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search methods, categories, documentation..."
            className="h-16 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
          />

          <button
            type="button"
            onClick={closePalette}
            aria-label="Close search"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Search results */}
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#111018] p-3"
        >
          {!query.trim() ? (
            <div className="px-4 py-14 text-center">
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                <Search className="size-5 text-violet-300" />
              </div>

              <p className="text-sm font-medium text-white">
                Search authentication boilerplates
              </p>

              <p className="mt-2 text-xs leading-relaxed text-white/45">
                Try email, OAuth, passkeys, OTP, database, or API.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                <Search className="size-5 text-white/30" />
              </div>

              <p className="text-sm font-medium text-white">
                No results found
              </p>

              <p className="mt-2 text-xs text-white/45">
                Try a different search term.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedResults.map(([group, groupResults]) => (
                <section
                  key={group}
                  role="group"
                  aria-label={group}
                >
                  <h2 className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300/70">
                    {group}
                  </h2>

                  <div className="space-y-1">
                    {groupResults.map((result) => {
                      const currentIndex = resultIndex++;
                      const Icon = RESULT_ICONS[result.type];
                      const isActive = currentIndex === activeIndex;

                      return (
                        <Link
                          key={result.id}
                          ref={(element) => {
                            resultRefs.current[currentIndex] =
                              element;
                          }}
                          id={`${listboxId}-${result.id}`}
                          href={result.href}
                          role="option"
                          aria-selected={isActive}
                          onClick={(event) => {
                            event.preventDefault();
                            navigateToResult(result);
                          }}
                          onMouseEnter={() =>
                            setActiveIndex(currentIndex)
                          }
                          className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                            isActive
                              ? "border-violet-400/20 bg-violet-500/10"
                              : "border-transparent hover:bg-white/[0.04]"
                          }`}
                        >
                          <span
                            className={`grid size-10 shrink-0 place-items-center rounded-lg border ${
                              isActive
                                ? "border-violet-400/20 bg-violet-400/10"
                                : "border-white/10 bg-white/[0.04]"
                            }`}
                          >
                            <Icon
                              className={`size-4 ${
                                isActive
                                  ? "text-violet-300"
                                  : "text-white/50"
                              }`}
                              aria-hidden="true"
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-white">
                              {result.title}
                            </span>

                            <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-white/45">
                              {result.description}
                            </span>
                          </span>

                          {isActive && (
                            <CornerDownLeft
                              className="size-4 shrink-0 text-violet-300"
                              aria-hidden="true"
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#111018] px-4 py-3 text-[11px] text-white/45">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <ArrowUp className="size-3" />
              <ArrowDown className="size-3" />
              Navigate
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CornerDownLeft className="size-3" />
              Open
            </span>
          </div>

          <span>
            <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono">
              ESC
            </kbd>{" "}
            to close
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPalette}
        aria-label="Open search"
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-zinc-400 transition-colors hover:border-violet-400/30 hover:bg-white/[0.08] hover:text-white"
      >
        <Search className="size-4" aria-hidden="true" />

        <span className="hidden sm:inline">Search</span>

        <kbd className="ml-2 hidden rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[11px] font-medium sm:inline">
          Ctrl K
        </kbd>
      </button>

      {isMounted && isOpen
        ? createPortal(dialog, document.body)
        : null}
    </>
  );
}
