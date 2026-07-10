import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 text-sm",
        className,
      )}
      {...props}
    />
  );
}
