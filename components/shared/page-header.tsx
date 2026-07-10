export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-10">
      <h1 className="font-(family-name:--font-display) text-3xl font-normal tracking-tight">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-(--color-ink-muted)">
          {description}
        </p>
      ) : null}
    </div>
  );
}
