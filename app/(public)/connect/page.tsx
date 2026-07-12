export const metadata = { title: "Connect" };

export default function ConnectPage() {
  return (
    <div className="py-(--spacing-section)">
      <p className="mb-3 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">Connect</p>
      <h1 className="max-w-2xl font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight text-balance">
        Say hello
      </h1>
      <p className="mt-6 max-w-prose text-base leading-relaxed text-(--color-ink-muted)">
        The best way to reach me is email. No forms, no metrics — just a message.
      </p>
      <div className="mt-8 flex flex-col gap-2 font-(family-name:--font-mono) text-sm">
        <a href="mailto:shirshmohan@gmail.com" className="text-(--color-accent) hover:underline">shirshmohan@gmail.com</a>
      </div>
    </div>
  );
}
