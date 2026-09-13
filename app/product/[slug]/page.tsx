"use client";

import { use } from "react";
import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ArrowUp, ExternalLink } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ProductLogo } from "@/components/product-logo";

const PRICING_LABEL: Record<Doc<"products">["pricingType"], string> = {
  free: "Free",
  freemium: "Freemium",
  paid: "Paid",
};

export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = use(params);
  const product = useQuery(api.products.getBySlug, { slug });
  const { isSignedIn } = useAuth();
  const toggleUpvote = useMutation(api.upvotes.toggle);

  if (product === undefined) {
    return <p className="mx-auto max-w-2xl px-4 py-10 text-muted-foreground">Loading…</p>;
  }

  if (product === null) {
    return <p className="mx-auto max-w-2xl px-4 py-10 text-muted-foreground">Product not found.</p>;
  }

  const upvoteButton = (
    <Button
      variant={product.viewerHasUpvoted ? "boost" : "outline"}
      className="rounded-full gap-1.5 font-mono tabular-nums"
      onClick={() => toggleUpvote({ productId: product._id })}
    >
      <ArrowUp className="size-4" />
      {product.upvoteCount} upvote{product.upvoteCount === 1 ? "" : "s"}
    </Button>
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

      <div className="flex items-start gap-4">
        <ProductLogo
          seed={product.logoSeed}
          name={product.name}
          size={64}
          featured={product.isFeatured}
        />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <p className="text-muted-foreground">{product.tagline}</p>
        </div>
        {isSignedIn ? upvoteButton : <SignInButton mode="modal">{upvoteButton}</SignInButton>}
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
          {PRICING_LABEL[product.pricingType]}
        </span>
        <a
          href={product.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-medium underline underline-offset-4"
        >
          Visit website
          <ExternalLink className="size-3.5" />
        </a>
      </div>

      <p className="max-w-prose whitespace-pre-wrap text-sm leading-relaxed">
        {product.description}
      </p>

      {(product.categories.length > 0 || product.topics.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {product.categories.map((category) => (
            <span
              key={category._id}
              className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
            >
              {category.name}
            </span>
          ))}
          {product.topics.map((topic) => (
            <span
              key={topic._id}
              className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground"
            >
              #{topic.name}
            </span>
          ))}
        </div>
      )}
    </main>
  );
}
