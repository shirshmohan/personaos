/**
 * Seed vocabulary for the tech-stack autocomplete (D42). Unlike genre, this is
 * NOT a constraint — you can type anything; these are just suggestions so the
 * field is useful on day one. Stored as tags under the `tech:` namespace, so
 * "every project using LangGraph" is the same query as "show all Fantasy".
 */
export const TECH_SUGGESTIONS = [
  "Python", "TypeScript", "JavaScript", "SQL", "Java", "C",
  "Next.js", "React", "Node.js", "Express", "FastAPI", "Flask",
  "PostgreSQL", "DuckDB", "ChromaDB", "MongoDB", "Drizzle", "SQLAlchemy",
  "LangChain", "LangGraph", "TensorFlow", "Keras", "scikit-learn", "PyTorch",
  "Docker", "AWS", "Vercel", "Tailwind", "Cloudinary", "Redis",
  "OpenAI", "GPT-4o", "RAG", "Recharts", "Streamlit",
] as const;

export const TECH_TAG_PREFIX = "tech:";

export function techToTag(name: string): string {
  return TECH_TAG_PREFIX + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
