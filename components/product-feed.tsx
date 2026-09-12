"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { todayInIST } from "@/lib/dates";
import { ProductCard } from "@/components/product-card";

export function ProductFeed() {
  const today = todayInIST();
  const products = useQuery(api.products.list, { day: today });

  if (products === undefined) {
    return <p className="text-muted-foreground">Loading products…</p>;
  }

  if (products.length === 0) {
    return (
      <p className="text-muted-foreground">
        No products yet today — be the first to submit one.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
