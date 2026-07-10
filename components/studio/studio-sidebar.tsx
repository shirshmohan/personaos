"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { ENTITY_TYPES, ENTITY_TYPE_META } from "@/features/entities/types";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150 ease-(--ease-quiet)",
        active
          ? "bg-(--color-surface-sunken) font-medium text-(--color-ink)"
          : "text-(--color-ink-muted) hover:bg-(--color-surface-sunken) hover:text-(--color-ink)",
      )}
    >
      {children}
    </Link>
  );
}

export function StudioSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Studio" className="flex flex-col gap-6">
      <NavLink href="/studio" active={pathname === "/studio"}>
        <LayoutGrid aria-hidden className="size-4" strokeWidth={1.75} />
        Workbench
      </NavLink>

      <div>
        <h2 className="px-2.5 pb-2 text-xs tracking-wide text-(--color-ink-muted) uppercase">
          Entities
        </h2>
        <ul className="flex flex-col gap-0.5">
          {ENTITY_TYPES.map((type) => {
            const { label, icon: Icon } = ENTITY_TYPE_META[type];
            const href = `/studio/${type}`;
            return (
              <li key={type}>
                <NavLink href={href} active={pathname.startsWith(href)}>
                  <Icon aria-hidden className="size-4" strokeWidth={1.75} />
                  {label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
