import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * An empty screen is an invitation to act, not an apology. No "Oops",
 * no shrug. Say what isn't here and what to do about it.
 */
export function EmptyState({
  icon: Icon,
  title,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-lg border border-dashed border-(--color-border) px-6 py-10",
        className,
      )}
    >
      {Icon ? (
        <Icon
          aria-hidden
          className="mb-3 size-5 text-(--color-ink-muted)"
          strokeWidth={1.5}
        />
      ) : null}
      <p className="text-sm text-(--color-ink-muted)">{title}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
