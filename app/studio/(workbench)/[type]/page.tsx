import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityList } from "@/components/shared/entity-list";
import { listEntitiesByType } from "@/features/entities/queries";
import { Button } from "@/components/ui/button";
import {
  ENTITY_TYPES,
  ENTITY_TYPE_META,
  isEntityType,
} from "@/features/entities/types";

/** Six known types — prerender the shells. */
export function generateStaticParams() {
  return ENTITY_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isEntityType(type)) return { title: "Not found" };
  return { title: ENTITY_TYPE_META[type].label };
}

export default async function EntityTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  // An unknown type is a 404, never an empty page pretending to be valid.
  if (!isEntityType(type)) notFound();

  const meta = ENTITY_TYPE_META[type];
  const items = await listEntitiesByType(type);

  const newHref = `/studio/${type}/new`;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title={meta.label} description={meta.blurb} />
        <Button asChild size="sm">
          <Link href={newHref}>New</Link>
        </Button>
      </div>
      {items.length > 0 ? (
        <EntityList entities={items} />
      ) : (
        <EmptyState
          icon={meta.icon}
          title={`No ${meta.label.toLowerCase()} entries yet.`}
          action={
            <Button asChild size="sm" variant="outline">
              <Link href={newHref}>Create the first one</Link>
            </Button>
          }
        />
      )}
    </>
  );
}
