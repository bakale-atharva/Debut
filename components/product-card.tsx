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
  compact = false,
}: {
  product: Doc<"products"> & {
    viewerHasUpvoted: boolean;
    logoUrl: string | undefined;
    badges: ProductBadges;
  };
  rank?: number;
  isTop3?: boolean;
  /** A narrower row for secondary contexts (e.g. a sidebar widget) — drops the award badge and pricing pill, and shrinks the logo/upvote control. */
  compact?: boolean;
}) {
  const { isSignedIn } = useAuth();
  const toggleUpvote = useMutation(api.upvotes.toggle);
  const logoSize = compact ? 32 : 48;

  const upvoteButton = (
    <Button
      variant={product.viewerHasUpvoted ? "boost" : "outline"}
      size="sm"
      aria-pressed={product.viewerHasUpvoted}
      className={cn("rounded-full gap-1.5 font-mono tabular-nums", compact && "px-2")}
      onClick={() => toggleUpvote({ productId: product._id })}
    >
      <ArrowUp aria-hidden="true" className="size-3.5" />
      {product.upvoteCount}
    </Button>
  );

  return (
    <div className={cn("flex items-center gap-4 py-4", compact && "gap-2.5 py-2.5")}>
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
          width={logoSize}
          height={logoSize}
          style={{ width: logoSize, height: logoSize }}
          className="shrink-0 rounded-[10px] object-cover"
        />
      ) : (
        <ProductLogo seed={product.logoSeed} name={product.name} size={logoSize} />
      )}
      <Link href={`/product/${product.slug}`} className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{product.name}</p>
        <p className="truncate text-sm text-muted-foreground">{product.tagline}</p>
      </Link>
      {!compact && (
        <>
          <ProductAwardBadge badges={product.badges} compact className="hidden sm:inline-flex" />
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            {PRICING_LABEL[product.pricingType]}
          </span>
        </>
      )}
      {isSignedIn ? (
        upvoteButton
      ) : (
        <SignInButton mode="modal">{upvoteButton}</SignInButton>
      )}
    </div>
  );
}
