import { cn } from "@/lib/utils";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function initialsFor(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}

export function ProductLogo({
  seed,
  name,
  size = 48,
  featured = false,
  className,
}: {
  seed: string;
  name: string;
  size?: number;
  featured?: boolean;
  className?: string;
}) {
  const colorIndex = (hashString(seed) % 5) + 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={`${name} logo`}
      className={cn(
        featured &&
          "rounded-[12px] ring-2 ring-signal ring-offset-2 ring-offset-background",
        className,
      )}
    >
      <rect
        width="48"
        height="48"
        rx="10"
        fill={`var(--chart-${colorIndex})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="18"
        fontWeight="600"
        fill="var(--background)"
      >
        {initialsFor(name)}
      </text>
    </svg>
  );
}
