import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EntityForm } from "@/components/studio/entity-form";
import { ENTITY_TYPE_META, isEntityType } from "@/features/entities/types";

export default async function NewEntityPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isEntityType(type)) notFound();

  return (
    <>
      <PageHeader title={`New ${ENTITY_TYPE_META[type].label.toLowerCase()}`} />
      <EntityForm
        initial={{
          type,
          title: "",
          slug: "",
          summary: "",
          status: "draft",
          body: [],
          occurredAt: "",
          metadata: {},
          coverMediaId: null,
          coverUrl: null,
          coverAlt: "",
        }}
      />
    </>
  );
}
