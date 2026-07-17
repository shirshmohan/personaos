import { embedUrl } from "@/features/entities/video";
import type { Block } from "@/features/entities/blocks";

/**
 * Renders body blocks as an article. Prose-first (D38): a comfortable measure,
 * real vertical rhythm, Instrument Serif headings. Code is a well-set guest —
 * present and readable, allowed to break the prose measure slightly wider.
 */
export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p
                key={block.id}
                className="max-w-prose text-[1.0625rem] leading-[1.75] text-(--color-ink) text-pretty"
              >
                {block.text}
              </p>
            );
          case "heading":
            return block.level === 2 ? (
              <h2
                key={block.id}
                className="mt-6 font-(family-name:--font-display) text-2xl leading-tight tracking-tight"
              >
                {block.text}
              </h2>
            ) : (
              <h3
                key={block.id}
                className="mt-4 font-(family-name:--font-display) text-xl leading-tight tracking-tight"
              >
                {block.text}
              </h3>
            );
          case "quote":
            return (
              <blockquote
                key={block.id}
                className="max-w-prose border-l-2 border-(--color-ink) pl-5 font-(family-name:--font-display) text-xl leading-snug text-pretty"
              >
                {block.text}
              </blockquote>
            );
          case "code":
            return (
              <figure key={block.id} className="-mx-1">
                {block.language && block.language !== "text" ? (
                  <figcaption className="mb-1.5 font-(family-name:--font-mono) text-xs text-(--color-ink-muted)">
                    {block.language}
                  </figcaption>
                ) : null}
                <pre className="overflow-x-auto rounded-lg border border-(--color-hairline) bg-(--color-surface-sunken) p-4 font-(family-name:--font-mono) text-[0.8125rem] leading-relaxed">
                  <code>{block.code}</code>
                </pre>
              </figure>
            );
          case "image":
            return (
              <figure key={block.id} className="my-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.url}
                  alt={block.alt}
                  className="w-full rounded-lg border border-(--color-hairline)"
                  loading="lazy"
                />
                {block.alt ? (
                  <figcaption className="mt-2 text-center text-xs text-(--color-ink-muted)">
                    {block.alt}
                  </figcaption>
                ) : null}
              </figure>
            );
          case "gallery":
            return (
              <figure key={block.id} className="my-2">
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {block.images.map((img) => (
                    <li key={img.mediaId ?? img.url}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.alt}
                        loading="lazy"
                        className="aspect-square w-full rounded-lg border border-(--color-hairline) object-cover"
                      />
                    </li>
                  ))}
                </ul>
              </figure>
            );
          case "video":
            return (
              <figure key={block.id} className="my-2">
                <div className="relative aspect-video overflow-hidden rounded-lg border border-(--color-hairline)">
                  <iframe
                    src={embedUrl(block.provider, block.videoId)}
                    title={block.caption || "Embedded video"}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
                {block.caption ? (
                  <figcaption className="mt-2 text-center text-xs text-(--color-ink-muted)">
                    {block.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
          case "divider":
            return (
              <hr key={block.id} className="my-4 border-(--color-hairline)" />
            );
        }
      })}
    </div>
  );
}
