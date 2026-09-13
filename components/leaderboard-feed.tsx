"use client";

import { useQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  formatDisplayDate,
  formatMonthLabel,
  formatWeekLabel,
  monthKeyFor,
  shiftDate,
  shiftMonth,
  shiftWeek,
  todayInIST,
  weekKeyFor,
} from "@/lib/dates";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Period = "day" | "week" | "month";

const PERIOD_LABEL: Record<Period, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

function defaultKeyFor(period: Period, referenceDay: string): string {
  if (period === "day") return referenceDay;
  if (period === "week") return weekKeyFor(referenceDay);
  return monthKeyFor(referenceDay);
}

export function LeaderboardFeed() {
  // Rankings for today don't exist until the nightly snapshot closes it, so
  // every period defaults to the most recently closed IST day (or its week/month).
  const referenceDay = shiftDate(todayInIST(), -1);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const period = (searchParams.get("period") as Period | null) ?? "day";
  const periodKey =
    searchParams.get("key") ?? defaultKeyFor(period, referenceDay);
  const categorySlug = searchParams.get("category") ?? undefined;

  const categories = useQuery(api.categories.list);
  const products = useQuery(api.rankings.getLeaderboard, {
    period,
    periodKey,
    categorySlug,
  });

  const defaultKey = defaultKeyFor(period, referenceDay);
  const atLatest = periodKey >= defaultKey;

  function updateParams(next: {
    period?: Period;
    key?: string;
    category?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextPeriod = next.period ?? period;

    if (nextPeriod === "day") params.delete("period");
    else params.set("period", nextPeriod);

    const nextKey =
      next.key ??
      (next.period ? defaultKeyFor(next.period, referenceDay) : periodKey);
    if (nextKey === defaultKeyFor(nextPeriod, referenceDay))
      params.delete("key");
    else params.set("key", nextKey);

    if (next.category !== undefined) {
      if (!next.category) params.delete("category");
      else params.set("category", next.category);
    }

    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }

  function goPrev() {
    if (period === "day") updateParams({ key: shiftDate(periodKey, -1) });
    else if (period === "week") updateParams({ key: shiftWeek(periodKey, -1) });
    else updateParams({ key: shiftMonth(periodKey, -1) });
  }

  function goNext() {
    if (period === "day") updateParams({ key: shiftDate(periodKey, 1) });
    else if (period === "week") updateParams({ key: shiftWeek(periodKey, 1) });
    else updateParams({ key: shiftMonth(periodKey, 1) });
  }

  const periodLabel =
    period === "day"
      ? formatDisplayDate(periodKey)
      : period === "week"
        ? formatWeekLabel(periodKey)
        : formatMonthLabel(periodKey);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={goPrev}>
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <p className="min-w-32 text-center font-mono text-sm tabular-nums sm:min-w-48">
            {periodLabel}
          </p>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={atLatest}
            onClick={goNext}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
          {(["day", "week", "month"] as const).map((p) => (
            <button
              key={p}
              aria-pressed={period === p}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium",
                period === p && "bg-primary text-primary-foreground",
              )}
              onClick={() => updateParams({ period: p })}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
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
        <p className="text-muted-foreground">Loading rankings…</p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground">
          No rankings for this period yet.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {products.map((product, i) => (
            <ProductCard
              key={product._id}
              product={product}
              rank={i + 1}
              isTop3={i < 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}
