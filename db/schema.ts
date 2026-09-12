import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from 'drizzle-orm/sqlite-core';
export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  state: text('state').notNull(),
  updatedAt: text('updated_at').notNull(),
});
export const documents = sqliteTable(
  'documents',
  {
    id: text('id').primaryKey(),
    owner: text('owner').notNull(),
    objectKey: text('object_key').notNull(),
    review: text('review'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('documents_owner').on(t.owner)],
);
export const sourceVersions = sqliteTable(
  'source_versions',
  {
    id: text('id').primaryKey(),
    url: text('url').notNull(),
    contentHash: text('content_hash').notNull(),
    text: text('text').notNull(),
    status: text('status').notNull(),
    createdAt: text('created_at').notNull(),
    reviewedBy: text('reviewed_by'),
  },
  (t) => [index('source_versions_url').on(t.url)],
);
export const audit = sqliteTable('admin_audit', {
  id: text('id').primaryKey(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  recordId: text('record_id').notNull(),
  at: text('at').notNull(),
});
export const limits = sqliteTable('rate_limits', {
  id: text('id').primaryKey(),
  count: integer('count').notNull(),
  expires: integer('expires').notNull(),
});
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
// SQL fields support deterministic matching/reporting; payload retains the full reviewed record.
export const catalogRecords = sqliteTable(
  'catalog_records',
  {
    key: text('key').primaryKey(),
    kind: text('kind').notNull(),
    recordId: text('record_id').notNull(),
    country: text('country').notNull(),
    payload: text('payload').notNull(),
    ielts: real('ielts'),
    ieltsComponentMin: real('ielts_component_min'),
    academic: real('academic'),
    academicRequirement: text('academic_requirement'),
    tuition: real('tuition'),
    tuitionCurrency: text('tuition_currency'),
    deadline: text('deadline'),
    requirements: text('requirements'),
    gpa: real('gpa'),
    gpaScale: real('gpa_scale'),
    minimumCredits: integer('minimum_credits'),
    amount: real('amount'),
    currency: text('currency'),
    sourceUrl: text('source_url'),
    verifiedAt: text('verified_at'),
    reviewDueAt: text('review_due_at'),
    status: text('status'),
    contentHash: text('content_hash'),
  },
  (t) => [index('catalog_kind_country').on(t.kind, t.country)],
);
export const knowledgeChunks = sqliteTable(
  'knowledge_chunks',
  {
    id: text('id').primaryKey(),
    sourceId: text('source_id').notNull(),
    sourceHash: text('source_hash').notNull(),
    text: text('text').notNull(),
    embeddingProfile: text('embedding_profile').notNull(),
    embedding: text('embedding').notNull(),
    indexedAt: text('indexed_at').notNull(),
  },
  (t) => [index('chunks_profile_source').on(t.embeddingProfile, t.sourceId)],
);
