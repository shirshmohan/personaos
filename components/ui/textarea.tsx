import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex w-full resize-y rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm leading-relaxed placeholder:text-(--color-ink-muted)",
        className,
      )}
      {...props}
    />
  );
}
