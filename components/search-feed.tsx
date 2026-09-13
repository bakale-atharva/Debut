"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { Search, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PricingType = Doc<"products">["pricingType"];

const PRICING_OPTIONS: { value: PricingType | undefined; label: string }[] = [
  { value: undefined, label: "All pricing" },
  { value: "free", label: "Free" },
  { value: "freemium", label: "Freemium" },
  { value: "paid", label: "Paid" },
];

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function SearchFeed() {
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebounced(term, 250);
  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined);
  const [pricingType, setPricingType] = useState<PricingType | undefined>(undefined);
  const [day, setDay] = useState<string | undefined>(undefined);

  const categories = useQuery(api.categories.list);
  const filters = { categorySlug, pricingType, day };
  const searchResults = useQuery(
    api.search.search,
    debouncedTerm.trim() ? { term: debouncedTerm.trim(), ...filters } : "skip",
  );
  const trendingResults = useQuery(
    api.search.trending,
    debouncedTerm.trim() ? "skip" : filters,
  );

  const isSearching = debouncedTerm.trim().length > 0;
  const products = isSearching ? searchResults : trendingResults;

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <aside className="flex w-full flex-col gap-6 md:w-56 md:shrink-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products…"
            className="pl-8"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-semibold text-muted-foreground">Pricing</h2>
          <div className="flex flex-col items-start gap-1">
            {PRICING_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => setPricingType(option.value)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  pricingType === option.value
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground hover:bg-accent",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-semibold text-muted-foreground">Launch date</h2>
          <div className="flex flex-col items-start gap-1.5">
            <button
              onClick={() => setDay(undefined)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                day === undefined
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-foreground hover:bg-accent",
              )}
            >
              All dates
            </button>
            <div className="flex w-full items-center gap-1">
              <Input
                type="date"
                value={day ?? ""}
                onChange={(e) => setDay(e.target.value || undefined)}
                className="font-mono text-xs tabular-nums"
              />
              {day && (
                <button
                  onClick={() => setDay(undefined)}
                  aria-label="Clear date"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {categories !== undefined && categories.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <h2 className="text-sm font-semibold text-muted-foreground">Category</h2>
            <div className="flex flex-col items-start gap-1">
              <button
                onClick={() => setCategorySlug(undefined)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  categorySlug === undefined
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground hover:bg-accent",
                )}
              >
                All categories
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => setCategorySlug(category.slug)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    categorySlug === category.slug
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-foreground hover:bg-accent",
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      <div className="min-w-0 flex-1">
        <h2 className="pb-4 text-sm font-semibold text-muted-foreground">
          {isSearching ? `Results for "${debouncedTerm.trim()}"` : "Trending now"}
        </h2>

        {products === undefined ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground">
            {isSearching ? "No products match your search." : "No trending products yet."}
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
