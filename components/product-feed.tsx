"use client";

import { useQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { formatDisplayDate, shiftDate, todayInIST } from "@/lib/dates";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProductFeed() {
  const today = todayInIST();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const day = searchParams.get("day") ?? today;
  const categorySlug = searchParams.get("category") ?? undefined;
  const featuredOnly = searchParams.get("featured") === "1";

  function updateParams(next: { day?: string; category?: string; featured?: boolean }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.day !== undefined) {
      if (next.day === today) params.delete("day");
      else params.set("day", next.day);
    }
    if (next.category !== undefined) {
      if (!next.category) params.delete("category");
      else params.set("category", next.category);
    }
    if (next.featured !== undefined) {
      if (!next.featured) params.delete("featured");
      else params.set("featured", "1");
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }

  const categories = useQuery(api.categories.list);
  const products = useQuery(api.products.list, { day, categorySlug, featuredOnly });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => updateParams({ day: shiftDate(day, -1) })}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <p className="min-w-32 text-center font-mono text-sm tabular-nums sm:min-w-40">
            {formatDisplayDate(day)}
          </p>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={day >= today}
            onClick={() => updateParams({ day: shiftDate(day, 1) })}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
          <button
            aria-pressed={!featuredOnly}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium",
              !featuredOnly && "bg-primary text-primary-foreground",
            )}
            onClick={() => updateParams({ featured: false })}
          >
            All
          </button>
          <button
            aria-pressed={featuredOnly}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium",
              featuredOnly && "bg-primary text-primary-foreground",
            )}
            onClick={() => updateParams({ featured: true })}
          >
            Featured
          </button>
        </div>
      </div>

      {categories !== undefined && categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            aria-pressed={categorySlug === undefined}
            onClick={() => updateParams({ category: "" })}
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
              aria-pressed={categorySlug === category.slug}
              onClick={() => updateParams({ category: category.slug })}
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
      )}

      {products === undefined ? (
        <p className="text-muted-foreground">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground">No products match these filters.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {products.map((product, i) => (
            <ProductCard key={product._id} product={product} rank={i + 1} isTop3={i < 3} />
          ))}
        </div>
      )}
    </div>
  );
}
