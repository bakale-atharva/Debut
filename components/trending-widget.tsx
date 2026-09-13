"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "@/components/product-card";

const MAX_SHOWN = 5;

export function TrendingWidget() {
  const products = useQuery(api.search.trending, {});

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground">Trending now</h2>

      {products === undefined ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No trending products yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {products.slice(0, MAX_SHOWN).map((product) => (
            <ProductCard key={product._id} product={product} compact />
          ))}
        </div>
      )}

      <Link
        href="/search"
        className="text-sm font-medium text-primary hover:underline underline-offset-4"
      >
        See what&rsquo;s trending
      </Link>
    </div>
  );
}
