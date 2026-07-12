"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** A quiet fade+lift on every route change. GPU-only; reduced-motion → instant. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    setShown(false);
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(6px)",
        transition: "opacity 0.4s var(--ease-quiet), transform 0.4s var(--ease-quiet)",
      }}
    >
      {children}
    </div>
  );
}
