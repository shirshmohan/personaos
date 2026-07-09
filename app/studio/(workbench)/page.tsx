export const metadata = { title: "Workbench" };

export default function StudioPage() {
  return (
    <section>
      <h1 className="font-(family-name:--font-display) text-2xl font-medium tracking-tight">
        Workbench
      </h1>
      {/* An empty screen is an invitation to act. The Shell lands in M2. */}
      <p className="mt-3 max-w-md text-sm leading-relaxed text-(--color-ink-muted)">
        Nothing here yet. The Studio shell arrives in Milestone 2, and the
        Universal Editor in Milestone 3. The foundation is live — auth,
        database, and media are wired.
      </p>
    </section>
  );
}
