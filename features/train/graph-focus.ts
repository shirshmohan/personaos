/**
 * Which node the cursor is on, published for the backdrop to react to.
 *
 * The neural background is a page-level canvas; the graph is an SVG island
 * inside it. They share no parent, so this can't be a prop. Deliberately not
 * React state either: the backdrop draws to canvas every frame and re-rendering
 * the whole graph to move a glow would cost frames for nothing.
 *
 * Coordinates are viewport-relative (clientX/clientY space), because that's the
 * only frame of reference the two components can agree on.
 */
export interface GraphFocus {
  x: number;
  y: number;
  /** False when nothing is hovered — the backdrop settles back down. */
  active: boolean;
}

let focus: GraphFocus = { x: 0, y: 0, active: false };
const subscribers = new Set<(f: GraphFocus) => void>();

export function setGraphFocus(next: GraphFocus): void {
  focus = next;
  for (const fn of subscribers) fn(next);
}

export function getGraphFocus(): GraphFocus {
  return focus;
}

export function subscribeGraphFocus(fn: (f: GraphFocus) => void): () => void {
  subscribers.add(fn);
  fn(focus);
  return () => {
    subscribers.delete(fn);
  };
}
