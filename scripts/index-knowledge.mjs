import { neon } from '@neondatabase/serverless';
import { createHash, randomUUID } from 'node:crypto';
import { createEmbeddingProvider } from '../ai/embeddings.ts';
const { DATABASE_URL, CATALOG_URL = 'http://localhost:3000/api/catalog' } =
  process.env;
const provider = createEmbeddingProvider(process.env);
if (!DATABASE_URL || !provider)
  throw new Error(
    'Set DATABASE_URL and the selected embedding provider key before indexing.',
  );
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
    await sql`SELECT d.id FROM source_documents d JOIN document_chunks c ON c.document_id=d.id WHERE d.content_hash=${hash} AND c.embedding_profile=${provider.profile} LIMIT 1`;
  if (exists.length) continue;
  const chunks = [];
  for (let start = 0; start < source.text.length; start += 1000)
    chunks.push(source.text.slice(start, start + 1200));
  const embeddings = await provider.embed(chunks, 'RETRIEVAL_DOCUMENT');
  const docId = randomUUID();
  const statements = [
    sql`INSERT INTO sources(id,url,country,topic,authority,"verificationStatus","verifiedAt","reviewDueAt","contentHash",confidence) VALUES(${source.id},${source.url},${source.country},${source.topic},${source.authority},'VERIFIED',${source.verifiedAt},${source.reviewDueAt},${hash},1) ON CONFLICT(id) DO UPDATE SET "verificationStatus"='VERIFIED',"verifiedAt"=excluded."verifiedAt","reviewDueAt"=excluded."reviewDueAt","contentHash"=excluded."contentHash"`,
    sql`DELETE FROM source_documents WHERE source_id=${source.id}`,
    sql`INSERT INTO source_documents(id,source_id,text,content_hash) VALUES(${docId},${source.id},${source.text},${hash})`,
    ...chunks.map(
      (text, ordinal) =>
        sql`INSERT INTO document_chunks(id,document_id,source_id,text,ordinal,embedding,embedding_profile) VALUES(${randomUUID()},${docId},${source.id},${text},${ordinal},${JSON.stringify(embeddings[ordinal])}::vector,${provider.profile})`,
    ),
  ];
  await sql.transaction(statements);
  count += chunks.length;
}
console.log(
  `Indexed ${count} new reviewed chunks. Unverified and expired sources were skipped.`,
);
