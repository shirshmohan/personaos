/**
 * Standard DSA pattern vocabulary (D53). Fixed-but-extensible like genre: pick
 * from these or create a new one that joins the list. Each pattern you use
 * becomes a Train ENTITY (D50). LeetCode topic tags SUGGEST; you ASSIGN — "Stack"
 * is a tag, "Monotonic Stack" is the pattern.
 */
export const DSA_PATTERNS = [
  "Two Pointers", "Sliding Window", "Fast & Slow Pointers", "Binary Search",
  "Binary Search on Answer", "Prefix Sum", "Monotonic Stack", "Monotonic Deque",
  "Stack Simulation", "Hashing", "Frequency Count", "Sorting", "Cyclic Sort",
  "Merge Intervals", "Greedy", "Backtracking", "Subsets & Permutations",
  "DFS", "BFS", "Union Find", "Topological Sort", "Dijkstra", "Bellman-Ford",
  "Trie", "Segment Tree", "Fenwick Tree (BIT)", "1D DP", "2D DP",
  "Knapsack", "DP on Subsequences", "DP on Strings", "DP on Trees",
  "Interval DP", "Bitmask DP", "Digit DP", "Kadane's", "Bit Manipulation",
  "Math & Number Theory", "Matrix Traversal", "Heap / Priority Queue",
  "K-way Merge", "Top-K Elements", "Linked List Reversal", "Tree Traversal",
  "Binary Tree Construction", "Lowest Common Ancestor", "Recursion",
  "Divide & Conquer", "Line Sweep", "Reservoir Sampling",
] as const;

export type DsaPattern = (typeof DSA_PATTERNS)[number];

export function suggestPatterns(topicTags: string[]): string[] {
  const map: Record<string, string[]> = {
    "Two Pointers": ["Two Pointers"], "Sliding Window": ["Sliding Window"],
    "Binary Search": ["Binary Search"], "Stack": ["Stack Simulation", "Monotonic Stack"],
    "Monotonic Stack": ["Monotonic Stack"], "Hash Table": ["Hashing"],
    "Dynamic Programming": ["1D DP", "2D DP"], "Backtracking": ["Backtracking"],
    "Greedy": ["Greedy"], "Depth-First Search": ["DFS"], "Breadth-First Search": ["BFS"],
    "Union Find": ["Union Find"], "Heap (Priority Queue)": ["Heap / Priority Queue"],
    "Trie": ["Trie"], "Bit Manipulation": ["Bit Manipulation"],
    "Linked List": ["Linked List Reversal"],
  };
  const out = new Set<string>();
  for (const tag of topicTags) for (const p of map[tag] ?? []) out.add(p);
  return [...out];
}
