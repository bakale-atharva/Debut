import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductBadges = {
  isProductOfDay: boolean;
  isProductOfWeek: boolean;
  isProductOfMonth: boolean;
};

/** Shows only the most prestigious badge a product holds — month, then week, then day. */
function topTier(badges: ProductBadges): "Month" | "Week" | "Day" | null {
  if (badges.isProductOfMonth) return "Month";
  if (badges.isProductOfWeek) return "Week";
  if (badges.isProductOfDay) return "Day";
  return null;
}

export function ProductAwardBadge({
  badges,
  compact = false,
  className,
}: {
  badges: ProductBadges;
  compact?: boolean;
  className?: string;
}) {
  const tier = topTier(badges);
  if (!tier) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-signal px-2.5 py-1 text-xs font-medium text-signal-foreground",
        className,
      )}
    >
      <Trophy className="size-3.5" />
      {compact ? tier : `Product of the ${tier}`}
    </span>
  );
}
