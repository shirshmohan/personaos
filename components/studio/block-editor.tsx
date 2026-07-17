"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import {
  BLOCK_LABELS,
  newBlock,
  type Block,
  type BlockType,
} from "@/features/entities/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaUpload } from "./media-upload";
import { PhotoLocation } from "./photo-location";
import { parseVideoUrl } from "@/features/entities/video";

const ORDER: BlockType[] = ["paragraph", "heading", "quote", "code", "image", "video", "divider"];

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}) {
  const update = (id: string, patch: Partial<Block>) =>
    onChange(
      blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)),
    );

  const move = (index: number, delta: number) => {
    const next = [...blocks];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) => (
        <div
          key={block.id}
          className="group rounded-md border border-(--color-border) p-3"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-(--color-ink-muted)">
              {BLOCK_LABELS[block.type]}
            </span>
            <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              <Button type="button" variant="ghost" size="sm" aria-label="Move up" onClick={() => move(i, -1)}>
                <ArrowUp className="size-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="sm" aria-label="Move down" onClick={() => move(i, 1)}>
                <ArrowDown className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Delete block"
                onClick={() => onChange(blocks.filter((b) => b.id !== block.id))}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

          {block.type === "paragraph" || block.type === "quote" ? (
            <Textarea
              rows={3}
              value={block.text}
              placeholder={block.type === "quote" ? "Quoted text…" : "Write…"}
              onChange={(e) => update(block.id, { text: e.target.value })}
            />
          ) : null}

          {block.type === "heading" ? (
            <div className="flex gap-2">
              <select
                aria-label="Heading level"
                className="h-10 rounded-md border border-(--color-border) bg-(--color-surface) px-2 text-sm"
                value={block.level}
                onChange={(e) =>
                  update(block.id, { level: Number(e.target.value) as 2 | 3 })
                }
              >
                <option value={2}>H2</option>
                <option value={3}>H3</option>
              </select>
              <Input
                value={block.text}
                placeholder="Heading"
                onChange={(e) => update(block.id, { text: e.target.value })}
              />
            </div>
          ) : null}

          {block.type === "code" ? (
            <div className="flex flex-col gap-2">
              <Input
                value={block.language}
                placeholder="Language"
                onChange={(e) => update(block.id, { language: e.target.value })}
              />
              <Textarea
                rows={5}
                className="font-(family-name:--font-mono) text-xs"
                value={block.code}
                onChange={(e) => update(block.id, { code: e.target.value })}
              />
            </div>
          ) : null}

          {block.type === "image" ? (
            <div className="flex flex-col gap-2">
              {block.url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={block.url}
                    alt={block.alt}
                    className="h-32 w-auto rounded-md border border-(--color-border)"
                  />
                  {/* Alt stays editable after upload. */}
                  <Input
                    value={block.alt}
                    placeholder="Describe this image (required)"
                    onChange={(e) => update(block.id, { alt: e.target.value })}
                  />
                  <PhotoLocation mediaId={block.mediaId} />
                </>
              ) : (
                <MediaUpload
                  onUploaded={(m) =>
                    update(block.id, { mediaId: m.id, url: m.url, alt: m.alt })
                  }
                />
              )}
            </div>
          ) : null}

          {block.type === "gallery" ? (
            <div className="flex flex-col gap-3">
              {block.images.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {block.images.map((img, i) => (
                    <li
                      key={img.mediaId ?? img.url}
                      className="flex flex-col gap-1.5 rounded-lg border border-(--color-border) p-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.alt}
                        className="aspect-square w-full rounded-md object-cover"
                      />
                      <Input
                        value={img.alt}
                        placeholder="Describe this photo"
                        onChange={(e) =>
                          update(block.id, {
                            images: block.images.map((x, j) =>
                              j === i ? { ...x, alt: e.target.value } : x,
                            ),
                          })
                        }
                      />
                      {/* Each photo's own pin — never merged with its neighbours. */}
                      <PhotoLocation mediaId={img.mediaId} />
                      <button
                        type="button"
                        onClick={() =>
                          update(block.id, {
                            images: block.images.filter((_, j) => j !== i),
                          })
                        }
                        className="self-start text-xs text-(--color-ink-muted) hover:text-(--color-ink)"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <MediaUpload
                multiple
                label={
                  block.images.length ? "Add more photos" : "Select photos"
                }
                onUploaded={(m) =>
                  update(block.id, {
                    images: [
                      ...block.images,
                      { mediaId: m.id, url: m.url, alt: m.alt },
                    ],
                  })
                }
              />
              <p className="text-xs text-(--color-ink-muted)">
                Select as many as you like at once. Each photo keeps its own
                location.
              </p>
            </div>
          ) : null}

          {block.type === "video" ? (
            <div className="flex flex-col gap-2">
              <Input
                defaultValue={block.videoId ? `${block.provider}:${block.videoId}` : ""}
                placeholder="Paste a YouTube or Vimeo link"
                onChange={(e) => {
                  const parsed = parseVideoUrl(e.target.value);
                  if (parsed) update(block.id, { provider: parsed.provider, videoId: parsed.videoId });
                }}
              />
              {block.videoId ? (
                <p className="text-xs text-(--color-ink-muted)">
                  {block.provider} · {block.videoId}
                </p>
              ) : (
                <p className="text-xs text-(--color-ink-muted)">
                  Paste the full link; we extract the embed.
                </p>
              )}
              <Input
                value={block.caption}
                placeholder="Caption (optional)"
                onChange={(e) => update(block.id, { caption: e.target.value })}
              />
            </div>
          ) : null}

          {block.type === "divider" ? (
            <hr className="border-(--color-border)" />
          ) : null}
        </div>
      ))}

      <div className="flex flex-wrap gap-1.5">
        {ORDER.map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...blocks, newBlock(type)])}
          >
            + {BLOCK_LABELS[type]}
          </Button>
        ))}
      </div>
    </div>
  );
}
