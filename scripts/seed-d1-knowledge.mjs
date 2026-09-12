import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createEmbeddingProvider } from '../ai/embeddings.ts';
const bundled = await build({
  stdin: {
    contents:
      "export { sources, programs } from './lib/catalog.ts'; export { scholarships, visas } from './lib/demo-knowledge.ts';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
});
const data = await import(
  'data:text/javascript;base64,' +
    Buffer.from(bundled.outputFiles[0].text).toString('base64')
);
const provider = createEmbeddingProvider(process.env);
if (!provider) throw Error('Embedding provider required.');
const q = (v) =>
  v == null
    ? 'NULL'
    : typeof v === 'number'
      ? String(v)
      : "'" + String(v).replaceAll("'", "''") + "'";
let sql = await readFile('drizzle/0001_yielding_sentinel.sql', 'utf8');
sql =
  sql.split('-- BEGIN REVIEWED DEMO SEED')[0] +
  '\n-- BEGIN REVIEWED DEMO SEED\n';
const columns =
  'key,kind,record_id,country,payload,ielts,ielts_component_min,academic,academic_requirement,tuition,tuition_currency,deadline,requirements,gpa,gpa_scale,minimum_credits,amount,currency,source_url,verified_at,review_due_at,status,content_hash';
for (const kind of ['sources', 'programs', 'scholarships', 'visas']) {
  for (const original of data[kind]) {
    const r = { ...original };
    if (kind === 'sources')
      r.contentHash = createHash('sha256').update(r.text).digest('hex');
    const values = [
      `${kind}:${r.id}`,
      kind,
      r.id,
      r.country,
      JSON.stringify(r),
      r.ielts,
      r.ieltsComponentMin,
      r.academic,
      r.academicRequirement,
      r.officialTuitionAmount,
      r.tuitionCurrency,
      r.deadline,
      r.requirements,
      r.continuationGpa,
      r.gpaScale,
      r.minimumCredits,
      r.amount ?? r.fundsAmount,
      r.currency ?? r.fundsCurrency,
      r.url,
      r.verifiedAt,
      r.reviewDueAt,
      r.status,
      r.contentHash,
    ];
    sql += `INSERT OR IGNORE INTO catalog_records (${columns}) VALUES (${values.map(q).join(',')});\n--> statement-breakpoint\n`;
  }
  // Existing administrator records take priority over the seed. Preserve full payload and structured fields.
  const fields = [
    'id',
    'country',
    null,
    'ielts',
    'ieltsComponentMin',
    'academic',
    'academicRequirement',
    'officialTuitionAmount',
    'tuitionCurrency',
    'deadline',
    'requirements',
    'continuationGpa',
    'gpaScale',
    'minimumCredits',
    'amount',
    'currency',
    'url',
    'verifiedAt',
    'reviewDueAt',
    'status',
    'contentHash',
  ];
  const selected = fields.map((f) =>
    f === null ? 'j.value' : `json_extract(j.value,'$.${f}')`,
  );
  sql += `INSERT OR REPLACE INTO catalog_records (${columns}) SELECT '${kind}:' || json_extract(j.value,'$.id'),'${kind}',${selected.join(',')} FROM settings s,json_each(s.value) j WHERE s.key='${kind}';\n--> statement-breakpoint\n`;
}
const verified = data.sources.filter((s) => s.status === 'VERIFIED');
const vectors = await provider.embed(
  verified.map((s) => s.text),
  'RETRIEVAL_DOCUMENT',
);
verified.forEach((s, i) => {
  const hash = createHash('sha256').update(s.text).digest('hex');
  const values = [
    s.id + ':0',
    s.id,
    hash,
    s.text,
    provider.profile,
    JSON.stringify(vectors[i]),
    new Date().toISOString(),
  ];
  sql += `INSERT OR IGNORE INTO knowledge_chunks (id,source_id,source_hash,text,embedding_profile,embedding,indexed_at) VALUES (${values.map(q).join(',')});\n--> statement-breakpoint\n`;
});
await writeFile('drizzle/0001_yielding_sentinel.sql', sql);
console.log(
  JSON.stringify({
    sources: data.sources.length,
    programs: data.programs.length,
    scholarships: data.scholarships.length,
    visas: data.visas.length,
    indexed: verified.length,
    profile: provider.profile,
  }),
);
