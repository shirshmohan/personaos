"use client";

import { Children, isValidElement } from "react";
import { Reveal } from "./reveal";

/** Reveals children in sequence — a choreographed entrance, not all-at-once. */
export function Stagger({
  children,
  step = 70,
  className,
}: {
  children: React.ReactNode;
  step?: number;
  className?: string;
}) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <>
      {items.map((child, i) => (
        <Reveal key={i} delay={i * step} className={className}>
          {child}
        </Reveal>
      ))}
    </>
  );
}
