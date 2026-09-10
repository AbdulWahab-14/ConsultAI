import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
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
