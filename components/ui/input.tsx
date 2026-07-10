import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm transition-colors duration-150 ease-(--ease-quiet) placeholder:text-(--color-ink-muted) disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
