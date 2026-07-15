"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Block } from "@/features/entities/blocks";
import { ENTITY_FIELDS, SUMMARY_MAX, TITLE_MAX } from "@/features/entities/schemas";
import { slugify } from "@/features/entities/slug";
import { saveEntity, archiveEntity } from "@/features/entities/actions";
import type { EntityType } from "@/features/entities/types";
import { BlockEditor } from "./block-editor";
import { MediaUpload } from "./media-upload";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { TagCombobox } from "./tag-combobox";
import { MultiSelect } from "./multi-select";
import { TechInput } from "./tech-input";
import { LocationField } from "./location-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface EntityFormValues {
  id?: string;
  type: EntityType;
  title: string;
  slug: string;
  summary: string;
  status: "draft" | "published" | "archived";
  body: Block[];
  occurredAt: string;
  metadata: Record<string, unknown>;
  coverMediaId: string | null;
  coverUrl: string | null;
  coverAlt: string;
  tags: string[];
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

export function EntityForm({ initial, tagVocabulary = [] }: { initial: EntityFormValues; tagVocabulary?: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [v, setV] = useState(initial);
  // Once the slug has been touched, stop deriving it from the title —
  // silently rewriting a published URL is a bug, not a convenience.
  const [slugLocked, setSlugLocked] = useState(Boolean(initial.id));

  const set = <K extends keyof EntityFormValues>(k: K, value: EntityFormValues[K]) =>
    setV((p) => ({ ...p, [k]: value }));

  // Catch it here rather than after a server round-trip.
  const summaryOver = v.summary.length > SUMMARY_MAX;
  const titleOver = v.title.length > TITLE_MAX;
  const invalid = summaryOver || titleOver || v.title.trim() === "";

  function submit(status: EntityFormValues["status"]) {
    setError(null);
    startTransition(async () => {
      const result = await saveEntity({ ...v, status });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/studio/${v.type}/${result.slug}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {error ? (
        <p role="alert" className="rounded-md border border-(--color-border) bg-(--color-surface-sunken) px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Title">
            <Input
              value={v.title}
              onChange={(e) => {
                const title = e.target.value;
                setV((p) => ({
                  ...p,
                  title,
                  slug: slugLocked ? p.slug : slugify(title),
                }));
              }}
            />
          </Field>
        </div>

        <Field label="Slug">
          <Input
            value={v.slug}
            onChange={(e) => {
              setSlugLocked(true);
              set("slug", slugify(e.target.value));
            }}
          />
        </Field>

        <Field label="Date">
          <Input
            type="date"
            value={v.occurredAt}
            onChange={(e) => set("occurredAt", e.target.value)}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Summary">
            <Textarea
              rows={2}
              aria-invalid={summaryOver}
              value={v.summary}
              onChange={(e) => set("summary", e.target.value)}
            />
          </Field>
          {/* A hard cap with no feedback is a trap. Show the count as it nears. */}
          {v.summary.length > SUMMARY_MAX - 50 ? (
            <p
              className={cn(
                "mt-1 text-xs tabular-nums",
                summaryOver ? "text-(--color-ink)" : "text-(--color-ink-muted)",
              )}
            >
              {v.summary.length} / {SUMMARY_MAX}
              {summaryOver ? " — move the detail into the body below" : null}
            </p>
          ) : null}
        </div>

        {/* Type-specific fields, rendered from the descriptors. */}
        {ENTITY_FIELDS[v.type].filter((f) => !f.hidden).map((f) => (
          f.kind === "multiselect" ? (
            <div key={f.name} className="sm:col-span-2">
              <Field label={f.label + (f.required ? " *" : "")}>
                <MultiSelect
                  options={f.options ?? []}
                  value={Array.isArray(v.metadata[f.name]) ? (v.metadata[f.name] as string[]) : []}
                  onChange={(next) => set("metadata", { ...v.metadata, [f.name]: next })}
                />
              </Field>
            </div>
          ) : (
          <Field key={f.name} label={f.label + (f.required ? " *" : "")}>
            {f.kind === "select" ? (
              <Select
                value={String(v.metadata[f.name] ?? "")}
                onChange={(e) =>
                  set("metadata", { ...v.metadata, [f.name]: e.target.value })
                }
              >
                <option value="">—</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                type={f.kind === "date" ? "date" : f.kind === "url" ? "url" : "text"}
                placeholder={f.placeholder}
                value={String(v.metadata[f.name] ?? "")}
                onChange={(e) =>
                  set("metadata", { ...v.metadata, [f.name]: e.target.value })
                }
              />
            )}
          </Field>
          )
        ))}
      </div>

      {v.type === "projects" ? (
        <div>
          <h2 className="mb-3 text-sm font-medium">Tech stack</h2>
          <TechInput
            value={Array.isArray(v.metadata.tech) ? (v.metadata.tech as string[]) : []}
            onChange={(tech) => set("metadata", { ...v.metadata, tech })}
          />
        </div>
      ) : null}

      {v.type === "travel" ? (
        <div>
          <h2 className="mb-3 text-sm font-medium">Location on the globe</h2>
          <LocationField
            lat={typeof v.metadata.lat === "number" ? v.metadata.lat : null}
            lng={typeof v.metadata.lng === "number" ? v.metadata.lng : null}
            onChange={(lat, lng) => set("metadata", { ...v.metadata, lat, lng })}
          />
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 text-sm font-medium">Tags</h2>
        <TagCombobox
          value={v.tags}
          vocabulary={tagVocabulary}
          onChange={(tags) => set("tags", tags)}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">Cover image</h2>
        {v.coverUrl ? (
          <div className="mb-3 flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={v.coverUrl}
              alt={v.coverAlt}
              className="h-24 w-auto rounded-md border border-(--color-border)"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setV((p) => ({ ...p, coverMediaId: null, coverUrl: null, coverAlt: "" }))
              }
            >
              Remove
            </Button>
          </div>
        ) : (
          <MediaUpload
            label="Upload cover"
            onUploaded={(m) =>
              setV((p) => ({ ...p, coverMediaId: m.id, coverUrl: m.url, coverAlt: m.alt }))
            }
          />
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">Body</h2>
        <BlockEditor blocks={v.body} onChange={(body) => set("body", body)} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-(--color-border) pt-6">
        <Button disabled={pending || invalid} onClick={() => submit("published")}>
          {pending ? "Saving…" : "Publish"}
        </Button>
        <Button
          variant="outline"
          disabled={pending || invalid}
          onClick={() => submit("draft")}
        >
          Save draft
        </Button>
        {v.id ? (
          <ConfirmButton
            className="ml-auto"
            variant="ghost"
            size="sm"
            disabled={pending}
            confirmLabel="Archive it?"
            onConfirm={() =>
              startTransition(async () => {
                await archiveEntity(v.id!, v.type);
              })
            }
          >
            Archive
          </ConfirmButton>
        ) : null}
      </div>
    </div>
  );
}
