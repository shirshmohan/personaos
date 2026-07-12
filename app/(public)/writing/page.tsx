import Link from "next/link";
import { listPublished } from "@/features/entities/public";

export const dynamic = "force-dynamic";
export const metadata = { title: "Writing" };

export default async function WritingList() {
  const posts = await listPublished("writing");

  return (
    <div className="py-(--spacing-section)">
      <header className="mb-16">
        <p className="mb-3 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">
          Writing
        </p>
        <h1 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight">
          Essays &amp; notes
        </h1>
      </header>

      {posts.length === 0 ? (
        <p className="text-sm text-(--color-ink-muted)">Nothing published yet.</p>
      ) : (
        <ul className="flex flex-col">
          {posts.map((post) => (
            <li key={post.slug} className="border-t border-(--color-hairline) last:border-b">
              <Link
                href={`/writing/${post.slug}`}
                className="group flex flex-col gap-1.5 py-6"
              >
                <h2 className="font-(family-name:--font-display) text-2xl leading-tight tracking-tight transition-transform duration-200 ease-(--ease-quiet) group-hover:translate-x-1">
                  {post.title}
                </h2>
                {post.summary ? (
                  <p className="max-w-prose text-sm leading-relaxed text-(--color-ink-muted) text-pretty">
                    {post.summary}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
