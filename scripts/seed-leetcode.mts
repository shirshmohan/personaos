/**
 * Seeds the full public LeetCode catalog into `leetcode_problem`.
 * PUBLIC data only — no login, no session cookie (D51).
 *
 * Run on YOUR machine (this sandbox can't reach leetcode.com):
 *   DATABASE_URL="<your neon url>" npx tsx scripts/seed-leetcode.mts
 *
 * It pages through leetcode.com/graphql politely and upserts each problem.
 */
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("Set DATABASE_URL"); process.exit(1); }

const QUERY = `query problemsetQuestionList($limit: Int, $skip: Int) {
  problemsetQuestionList: questionList(
    categorySlug: "" limit: $limit skip: $skip filters: {}
  ) {
    total: totalNum
    questions: data {
      frontendQuestionId: questionFrontendId
      title titleSlug difficulty paidOnly: isPaidOnly
      topicTags { name }
    }
  }
}`;

async function fetchPage(skip: number, limit: number) {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Referer": "https://leetcode.com" },
    body: JSON.stringify({ query: QUERY, variables: { skip, limit } }),
  });
  if (!res.ok) throw new Error(`LeetCode returned ${res.status}`);
  const json = await res.json();
  return json.data.problemsetQuestionList;
}

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const limit = 100;
  let skip = 0, total = Infinity, count = 0;

  while (skip < total) {
    const page = await fetchPage(skip, limit);
    total = page.total;
    for (const q of page.questions) {
      await pool.query(
        `INSERT INTO leetcode_problem (slug, frontend_id, title, difficulty, topic_tags, paid_only)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (slug) DO UPDATE SET
           frontend_id=$2, title=$3, difficulty=$4, topic_tags=$5, paid_only=$6`,
        [q.titleSlug, Number(q.frontendQuestionId) || null, q.title, q.difficulty,
         JSON.stringify((q.topicTags ?? []).map((t: {name:string}) => t.name)), !!q.paidOnly],
      );
      count++;
    }
    skip += limit;
    process.stdout.write(`\rseeded ${count}/${total}`);
    await new Promise((r) => setTimeout(r, 400)); // be polite
  }
  console.log(`\nDone. ${count} problems in the catalog.`);
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
