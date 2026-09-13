"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
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

export function LeaderboardFeed() {
  // Rankings for today don't exist until the nightly snapshot closes it, so
  // every period defaults to the most recently closed IST day (or its week/month).
  const referenceDay = shiftDate(todayInIST(), -1);

  const [period, setPeriod] = useState<Period>("day");
  const [dayKey, setDayKey] = useState(referenceDay);
  const [weekKey, setWeekKey] = useState(weekKeyFor(referenceDay));
  const [monthKey, setMonthKey] = useState(monthKeyFor(referenceDay));
  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined);

  const categories = useQuery(api.categories.list);

  const periodKey = period === "day" ? dayKey : period === "week" ? weekKey : monthKey;
  const atLatest =
    period === "day"
      ? dayKey >= referenceDay
      : period === "week"
        ? weekKey >= weekKeyFor(referenceDay)
        : monthKey >= monthKeyFor(referenceDay);

  const products = useQuery(api.rankings.getLeaderboard, { period, periodKey, categorySlug });

  function goPrev() {
    if (period === "day") setDayKey((d) => shiftDate(d, -1));
    else if (period === "week") setWeekKey((w) => shiftWeek(w, -1));
    else setMonthKey((m) => shiftMonth(m, -1));
  }

  function goNext() {
    if (period === "day") setDayKey((d) => shiftDate(d, 1));
    else if (period === "week") setWeekKey((w) => shiftWeek(w, 1));
    else setMonthKey((m) => shiftMonth(m, 1));
  }

  const periodLabel =
    period === "day"
      ? formatDisplayDate(dayKey)
      : period === "week"
        ? formatWeekLabel(weekKey)
        : formatMonthLabel(monthKey);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={goPrev}>
            <ChevronLeft className="size-4" />
          </Button>
          <p className="min-w-32 text-center font-mono text-sm tabular-nums sm:min-w-48">
            {periodLabel}
          </p>
          <Button variant="outline" size="icon-sm" disabled={atLatest} onClick={goNext}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
          {(["day", "week", "month"] as const).map((p) => (
            <button
              key={p}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium",
                period === p && "bg-primary text-primary-foreground",
              )}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {categories !== undefined && categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
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
      )}

      {products === undefined ? (
        <p className="text-muted-foreground">Loading rankings…</p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground">No rankings for this period yet.</p>
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
