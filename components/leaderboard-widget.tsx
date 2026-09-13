"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { shiftDate, todayInIST, weekKeyFor } from "@/lib/dates";
import { ProductCard } from "@/components/product-card";

const MAX_SHOWN = 3;

export function LeaderboardWidget() {
  // Rankings only exist for closed periods — mirrors LeaderboardFeed's default.
  const periodKey = weekKeyFor(shiftDate(todayInIST(), -1));
  const products = useQuery(api.rankings.getLeaderboard, {
    period: "week",
    periodKey,
  });

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground">
        This week&rsquo;s leaderboard
      </h2>

      {products === undefined ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No rankings for this week yet.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {products.slice(0, MAX_SHOWN).map((product, i) => (
            <ProductCard
              key={product._id}
              product={product}
              rank={i + 1}
              isTop3={i < 3}
              compact
            />
          ))}
        </div>
      )}

      <Link
        href="/leaderboard"
        className="text-sm font-medium text-primary hover:underline underline-offset-4"
      >
        View full leaderboard
      </Link>
    </div>
  );
}
