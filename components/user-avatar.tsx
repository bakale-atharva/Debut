import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  avatarUrl,
  size = 24,
  className,
}: {
  name: string;
  avatarUrl?: string;
  size?: number;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        title={name}
        style={{ width: size, height: size }}
        className={cn("shrink-0 rounded-full object-cover ring-2 ring-background", className)}
      />
    );
  }

  return (
    <span
      title={name}
      style={{ width: size, height: size }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-medium text-secondary-foreground ring-2 ring-background",
        className,
      )}
    >
      {name[0]?.toUpperCase() ?? "?"}
    </span>
  );
}
