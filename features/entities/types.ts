import {
  BookOpen,
  Briefcase,
  Image,
  MapPin,
  PenLine,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { ENTITY_TYPES, type EntityType } from "@/lib/db/schema";

/**
 * The Studio's spine. Rule 6 — everything is an Entity, so the navigation is
 * the entity model itself, not a menu of screens. Add a type here and it
 * appears in the sidebar, the Workbench, and its own listing route.
 */
export const ENTITY_TYPE_META: Record<
  EntityType,
  { label: string; icon: LucideIcon; blurb: string }
> = {
  career: {
    label: "Career",
    icon: Briefcase,
    blurb: "Roles, internships, and the work itself.",
  },
  writing: {
    label: "Writing",
    icon: PenLine,
    blurb: "Essays, notes, and things worth saying.",
  },
  travel: {
    label: "Travel",
    icon: MapPin,
    blurb: "Places been, and what they were like.",
  },
  train: {
    label: "Train",
    icon: Terminal,
    blurb: "The practice log — problems, patterns, progress.",
  },
  library: {
    label: "Library",
    icon: BookOpen,
    blurb: "Books read and references kept.",
  },
  gallery: {
    label: "Gallery",
    icon: Image,
    blurb: "Visual and design work.",
  },
};

export function isEntityType(value: string): value is EntityType {
  return (ENTITY_TYPES as readonly string[]).includes(value);
}

export { ENTITY_TYPES, type EntityType };
