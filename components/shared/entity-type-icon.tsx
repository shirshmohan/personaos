import { ENTITY_TYPE_META, type EntityType } from "@/features/entities/types";
import { cn } from "@/lib/utils";

export function EntityTypeIcon({
  type,
  className,
}: {
  type: EntityType;
  className?: string;
}) {
  const Icon = ENTITY_TYPE_META[type].icon;
  return (
    <Icon aria-hidden className={cn("size-4", className)} strokeWidth={1.75} />
  );
}
