"use client";

import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { ArrowUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ProductLogo } from "@/components/product-logo";
import { ProductAwardBadge, type ProductBadges } from "@/components/product-award-badge";
import { cn } from "@/lib/utils";

const PRICING_LABEL: Record<Doc<"products">["pricingType"], string> = {
  free: "Free",
  freemium: "Freemium",
  paid: "Paid",
};

export function ProductCard({
  product,
  rank,
  isTop3,
}: {
  product: Doc<"products"> & {
    viewerHasUpvoted: boolean;
    logoUrl: string | undefined;
    badges: ProductBadges;
  };
  rank?: number;
  isTop3?: boolean;
}) {
  const { isSignedIn } = useAuth();
  const toggleUpvote = useMutation(api.upvotes.toggle);

  const upvoteButton = (
    <Button
      variant={product.viewerHasUpvoted ? "boost" : "outline"}
      size="sm"
      className="rounded-full gap-1.5 font-mono tabular-nums"
      onClick={() => toggleUpvote({ productId: product._id })}
    >
      <ArrowUp className="size-3.5" />
      {product.upvoteCount}
    </Button>
  );

  return (
    <div className="flex items-center gap-4 py-4">
      {rank !== undefined && (
        <span
          className={cn(
            "w-6 shrink-0 text-right font-mono text-sm tabular-nums text-muted-foreground",
            isTop3 && "text-signal-text font-semibold",
          )}
        >
          {String(rank).padStart(2, "0")}
        </span>
      )}
      {product.logoUrl ? (
        <img
          src={product.logoUrl}
          alt={`${product.name} logo`}
          className="size-12 shrink-0 rounded-[10px] object-cover"
        />
      ) : (
        <ProductLogo seed={product.logoSeed} name={product.name} />
      )}
      <Link href={`/product/${product.slug}`} className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{product.name}</p>
        <p className="truncate text-sm text-muted-foreground">{product.tagline}</p>
      </Link>
      <ProductAwardBadge badges={product.badges} compact className="hidden sm:inline-flex" />
      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
        {PRICING_LABEL[product.pricingType]}
      </span>
      {isSignedIn ? (
        upvoteButton
      ) : (
        <SignInButton mode="modal">{upvoteButton}</SignInButton>
      )}
    </div>
  );
}
