"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Command, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 250;

export function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const urlTerm = searchParams.get("q") ?? "";
  const [term, setTerm] = useState(urlTerm);
  const [syncedUrlTerm, setSyncedUrlTerm] = useState(urlTerm);

  // Stay in sync when `q` changes from elsewhere (browser back/forward, a direct link) —
  // adjusted during render rather than in an effect, per React's "adjusting state" pattern.
  if (urlTerm !== syncedUrlTerm) {
    setSyncedUrlTerm(urlTerm);
    setTerm(urlTerm);
  }

  // Debounced: push the typed term into the URL, which the /search page reads.
  useEffect(() => {
    const trimmed = term.trim();
    const timer = setTimeout(() => {
      const query = trimmed ? `?q=${encodeURIComponent(trimmed)}` : "";
      if (pathname === "/search") {
        router.replace(`/search${query}`, { scroll: false });
      } else if (trimmed) {
        router.push(`/search${query}`);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pathname/router intentionally excluded so this only re-fires on typing
  }, [term]);

  // Cmd/Ctrl+K focuses the search input from anywhere in the app.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search products…"
        className="pl-8 pr-11"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:flex">
        <Command className="size-2.5" />K
      </kbd>
    </div>
  );
}
