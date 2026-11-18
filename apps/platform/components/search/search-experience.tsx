"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/providers/language-provider";
import { translateKey } from "@/lib/dictionaries";
import { cn } from "cn";

export type SearchEntry = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  categoryKey: string;
  keywords?: string;
};

const RECENT_KEY = "shadtech-recent-searches";
const MAX_RECENT = 5;
const emptyRecent: string[] = [];
const recentListeners = new Set<() => void>();
let cachedRecent: string[] | null = null;

function subscribeRecent(listener: () => void) {
  recentListeners.add(listener);
  const handleStorage = () => {
    cachedRecent = readRecent();
    listener();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  cachedRecent = readRecent();
  return () => {
    recentListeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
    if (recentListeners.size === 0) cachedRecent = null;
  };
}

function readRecent(): string[] {
  if (typeof window === "undefined") return emptyRecent;
  try {
    const stored = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
    return Array.isArray(stored) ? stored.slice(0, MAX_RECENT) : emptyRecent;
  } catch {
    return emptyRecent;
  }
}

function getRecentSnapshot() {
  return cachedRecent ?? emptyRecent;
}

function getRecentServerSnapshot() {
  return emptyRecent;
}

function updateRecent(next: string[]) {
  cachedRecent = next;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable; the search still works.
  }
  recentListeners.forEach((listener) => listener());
}

export function SearchExperience({
  entries,
  initialQuery = "",
  basePath,
  titleKey,
  descriptionKey,
  scopeKey,
  emptyKey = "search.noResults",
}: {
  entries: SearchEntry[];
  initialQuery?: string;
  basePath: string;
  titleKey: string;
  descriptionKey?: string;
  scopeKey: string;
  emptyKey?: string;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const recent = useSyncExternalStore(subscribeRecent, getRecentSnapshot, getRecentServerSnapshot);
  const [query, setQuery] = useState(initialQuery);
  const [previousInitialQuery, setPreviousInitialQuery] = useState(initialQuery);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (initialQuery !== previousInitialQuery) {
    setPreviousInitialQuery(initialQuery);
    setQuery(initialQuery);
    setActiveIndex(-1);
  }

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return entries
      .filter((entry) =>
        [entry.title, entry.subtitle, entry.keywords, translateKey(t, entry.categoryKey)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 24);
  }, [entries, query, t]);

  function saveRecent(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const next = [
      trimmed,
      ...recent.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, MAX_RECENT);
    updateRecent(next);
  }

  function submit(value = query) {
    saveRecent(value);
    setShowSuggestions(false);
    router.push(value.trim() ? `${basePath}?q=${encodeURIComponent(value.trim())}` : basePath);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setShowSuggestions(true);
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
      return;
    }
    if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (showSuggestions && activeIndex >= 0 && results[activeIndex]) {
        router.push(results[activeIndex].href);
        return;
      }
      submit();
      return;
    }
    if (event.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  }

  const title = translateKey(t, titleKey) ?? titleKey;
  const description = descriptionKey ? translateKey(t, descriptionKey) : undefined;

  return (
    <div className="section-shell py-10 sm:py-14">
      <div className="max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">
          {translateKey(t, scopeKey) ?? scopeKey}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>}

        <div className="relative mt-8">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            role="search"
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                name="q"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(-1);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
                onKeyDown={onKeyDown}
                placeholder={t.search.placeholder}
                aria-label={t.common.search}
                role="combobox"
                aria-expanded={showSuggestions && (results.length > 0 || recent.length > 0)}
                aria-controls="search-suggestions"
                aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
                autoComplete="off"
                className="h-12 rounded-full ps-11 pe-4"
              />
            </div>
            <Button type="submit" variant="brand" size="xl">
              {t.common.search}
              <ArrowRight className="ms-2 size-4 rtl:rotate-180" />
            </Button>
          </form>

          {showSuggestions && query.trim().length === 0 && recent.length > 0 && (
            <div
              id="search-suggestions"
              className="surface-card absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 p-2"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.shell.recentSearches}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    updateRecent(emptyRecent);
                    try {
                      localStorage.removeItem(RECENT_KEY);
                    } catch {
                      // Ignore storage errors.
                    }
                  }}
                  className="text-xs text-brand-orange hover:underline"
                >
                  {t.shell.clearRecent}
                </button>
              </div>
              {recent.map((item) => (
                <button
                  key={item}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setQuery(item);
                    submit(item);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-sm hover:bg-brand-canvas"
                >
                  <Clock3 className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          )}

          {showSuggestions && query.trim().length > 0 && results.length > 0 && (
            <div
              id="search-suggestions"
              className="surface-card absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 max-h-80 overflow-y-auto p-2"
              role="listbox"
            >
              {results.slice(0, 8).map((entry, index) => (
                <button
                  key={entry.id}
                  id={`search-result-${index}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => router.push(entry.href)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-start text-sm",
                    activeIndex === index ? "bg-brand-orange/10" : "hover:bg-brand-canvas",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{entry.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {translateKey(t, entry.categoryKey) ?? entry.categoryKey}
                      {entry.subtitle ? ` · ${entry.subtitle}` : ""}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-brand-orange rtl:rotate-180" />
                </button>
              ))}
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => submit()}
                className="mt-1 w-full rounded-xl px-3 py-2 text-start text-xs font-semibold text-brand-orange hover:bg-brand-orange/10"
              >
                {t.shell.pressEnter}
              </button>
            </div>
          )}
        </div>

        {query.trim().length > 0 && (
          <div className="mt-10 space-y-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{t.search.results}</h2>
              <span className="text-xs text-muted-foreground">{results.length}</span>
            </div>
            {results.length === 0 ? (
              <div className="surface-card px-6 py-10 text-center text-sm text-muted-foreground">
                {translateKey(t, emptyKey) ?? emptyKey}
              </div>
            ) : (
              Object.entries(
                results.reduce<Record<string, SearchEntry[]>>((groups, entry) => {
                  groups[entry.categoryKey] = [...(groups[entry.categoryKey] ?? []), entry];
                  return groups;
                }, {}),
              ).map(([categoryKey, items]) => (
                <section key={categoryKey}>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    {translateKey(t, categoryKey) ?? categoryKey}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((entry) => (
                      <a
                        key={entry.id}
                        href={entry.href}
                        className="surface-card group flex items-center justify-between gap-4 p-4 transition-shadow hover:shadow-[var(--shadow-lift)]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{entry.title}</span>
                          {entry.subtitle && (
                            <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">
                              {entry.subtitle}
                            </span>
                          )}
                        </span>
                        <ArrowRight className="size-4 shrink-0 text-brand-orange transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                      </a>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
