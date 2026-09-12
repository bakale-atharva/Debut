"use client";

import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { ArrowUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductLogo } from "@/components/product-logo";

const PRICING_LABEL: Record<Doc<"products">["pricingType"], string> = {
  free: "Free",
  freemium: "Freemium",
  paid: "Paid",
};

export function ProductCard({
  product,
}: {
  product: Doc<"products"> & { viewerHasUpvoted: boolean };
}) {
  const { isSignedIn } = useAuth();
  const toggleUpvote = useMutation(api.upvotes.toggle);

  const upvoteButton = (
    <Button
      variant={product.viewerHasUpvoted ? "default" : "outline"}
      size="sm"
      className="flex h-auto flex-col gap-0 px-3 py-1.5"
      onClick={() => toggleUpvote({ productId: product._id })}
    >
      <ArrowUp className="size-4" />
      {product.upvoteCount}
    </Button>
  );

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <ProductLogo seed={product.logoSeed} name={product.name} />
        <Link href={`/product/${product.slug}`} className="min-w-0 flex-1">
          <p className="truncate font-medium">{product.name}</p>
          <p className="truncate text-sm text-muted-foreground">{product.tagline}</p>
        </Link>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {PRICING_LABEL[product.pricingType]}
        </span>
        {isSignedIn ? (
          upvoteButton
        ) : (
          <SignInButton mode="modal">{upvoteButton}</SignInButton>
        )}
      </CardContent>
    </Card>
  );
}
