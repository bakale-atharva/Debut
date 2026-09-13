"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ProductCard } from "@/components/product-card";

export function SimilarProducts({ productId }: { productId: Id<"products"> }) {
  const products = useQuery(api.search.similar, { productId });

  if (products !== undefined && products.length === 0) return null;

  return (
    <div className="border-t border-border pt-6">
      <h2 className="pb-2 text-sm font-semibold text-muted-foreground">Similar products</h2>
      {products === undefined ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
