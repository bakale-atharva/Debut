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
  className,
}: {
  seed: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const colorIndex = (hashString(seed) % 5) + 1;
  const textColor = colorIndex === 1 ? "var(--foreground)" : "var(--background)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={`${name} logo`}
      className={className}
    >
      <rect width="48" height="48" rx="10" fill={`var(--chart-${colorIndex})`} />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="18"
        fontWeight="600"
        fill={textColor}
      >
        {initialsFor(name)}
      </text>
    </svg>
  );
}
