import { neon } from '@neondatabase/serverless';
import { createHash, randomUUID } from 'node:crypto';
const {
  DATABASE_URL,
  OPENAI_API_KEY,
  EMBEDDING_MODEL = 'text-embedding-3-small',
  CATALOG_URL = 'http://localhost:3000/api/catalog',
} = process.env;
if (!DATABASE_URL || !OPENAI_API_KEY)
  throw new Error('Set DATABASE_URL and OPENAI_API_KEY before indexing.');
const r = await fetch(CATALOG_URL);
if (!r.ok) throw new Error('Catalog unavailable.');
const { sources } = await r.json();
const sql = neon(DATABASE_URL);
let count = 0;
for (const source of sources.filter(
  (s) => s.status === 'VERIFIED' && new Date(s.reviewDueAt) > new Date(),
)) {
  const hash = createHash('sha256').update(source.text).digest('hex');
  const exists =
    await sql`SELECT id FROM source_documents WHERE content_hash=${hash}`;
  if (exists.length) continue;
  const chunks = [];
  for (let start = 0; start < source.text.length; start += 1000)
    chunks.push(source.text.slice(start, start + 1200));
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      dimensions: 1536,
      input: chunks,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error('Embedding request failed; no new record published.');
  const embeddings = (await response.json()).data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
  if (
    embeddings.length !== chunks.length ||
    embeddings.some(
      (v) => v.length !== 1536 || v.some((n) => !Number.isFinite(n)),
    )
  )
    throw new Error('Invalid embedding response.');
  const docId = randomUUID();
  const statements = [
    sql`INSERT INTO sources(id,url,country,topic,authority,"verificationStatus","verifiedAt","reviewDueAt","contentHash",confidence) VALUES(${source.id},${source.url},${source.country},${source.topic},${source.authority},'VERIFIED',${source.verifiedAt},${source.reviewDueAt},${hash},1) ON CONFLICT(id) DO UPDATE SET "verificationStatus"='VERIFIED',"verifiedAt"=excluded."verifiedAt","reviewDueAt"=excluded."reviewDueAt","contentHash"=excluded."contentHash"`,
    sql`DELETE FROM source_documents WHERE source_id=${source.id}`,
    sql`INSERT INTO source_documents(id,source_id,text,content_hash) VALUES(${docId},${source.id},${source.text},${hash})`,
    ...chunks.map(
      (text, ordinal) =>
        sql`INSERT INTO document_chunks(id,document_id,source_id,text,ordinal,embedding) VALUES(${randomUUID()},${docId},${source.id},${text},${ordinal},${JSON.stringify(embeddings[ordinal])}::vector`,
    ),
  ];
  await sql.transaction(statements);
  count += chunks.length;
}
console.log(
  `Indexed ${count} new reviewed chunks. Unverified and expired sources were skipped.`,
);
