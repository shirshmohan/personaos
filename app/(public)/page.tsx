export default function HomePage() {
  return (
    <section className="flex flex-col justify-center py-(--spacing-section)">
      <h1 className="max-w-2xl font-(family-name:--font-display) text-4xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">
        Designed, engineered, and continuously evolving
        <span className="text-(--color-ink-muted)"> — like Shirsh Mohan.</span>
      </h1>
      <p className="mt-6 max-w-lg text-base leading-relaxed text-(--color-ink-muted) text-pretty">
        A personal operating system that happens to have a public face. The
        Experiences arrive in Milestone 5.
      </p>
    </section>
  );
}
