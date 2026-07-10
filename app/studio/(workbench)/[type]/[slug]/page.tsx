import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EntityForm } from "@/components/studio/entity-form";
import { getEntityBySlug, getMediaById } from "@/features/entities/queries";
import { isEntityType } from "@/features/entities/types";
import { bodySchema } from "@/features/entities/blocks";

export default async function EditEntityPage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}) {
  const { type, slug } = await params;
  if (!isEntityType(type)) notFound();

  const entity = await getEntityBySlug(type, slug);
  if (!entity) notFound();

  // Body is jsonb — trust nothing that came out of a JSONB column.
  const body = bodySchema.safeParse(entity.body);
  const cover = entity.coverMediaId
    ? await getMediaById(entity.coverMediaId)
    : undefined;

  return (
    <>
      <PageHeader
        title={entity.title}
        description={entity.status === "draft" ? "Draft" : "Published"}
      />
      <EntityForm
        initial={{
          id: entity.id,
          type,
          title: entity.title,
          slug: entity.slug,
          summary: entity.summary ?? "",
          status: entity.status,
          body: body.success ? body.data : [],
          occurredAt: entity.occurredAt
            ? entity.occurredAt.toISOString().slice(0, 10)
            : "",
          metadata: (entity.metadata ?? {}) as Record<string, unknown>,
          coverMediaId: entity.coverMediaId,
          coverUrl: cover?.url ?? null,
          coverAlt: cover?.alt ?? "",
        }}
      />
    </>
  );
}
