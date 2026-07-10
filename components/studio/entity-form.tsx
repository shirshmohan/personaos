"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Block } from "@/features/entities/blocks";
import { ENTITY_FIELDS } from "@/features/entities/schemas";
import { slugify } from "@/features/entities/slug";
import { saveEntity, archiveEntity } from "@/features/entities/actions";
import type { EntityType } from "@/features/entities/types";
import { BlockEditor } from "./block-editor";
import { MediaUpload } from "./media-upload";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

export function EntityForm({ initial }: { initial: EntityFormValues }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [v, setV] = useState(initial);
  // Once the slug has been touched, stop deriving it from the title —
  // silently rewriting a published URL is a bug, not a convenience.
  const [slugLocked, setSlugLocked] = useState(Boolean(initial.id));

  const set = <K extends keyof EntityFormValues>(k: K, value: EntityFormValues[K]) =>
    setV((p) => ({ ...p, [k]: value }));

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
              value={v.summary}
              onChange={(e) => set("summary", e.target.value)}
            />
          </Field>
        </div>

        {/* Type-specific fields, rendered from the descriptors. */}
        {ENTITY_FIELDS[v.type].map((f) => (
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
        ))}
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
        <Button disabled={pending} onClick={() => submit("published")}>
          {pending ? "Saving…" : "Publish"}
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => submit("draft")}>
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
