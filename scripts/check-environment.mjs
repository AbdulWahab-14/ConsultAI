const live = process.argv.includes('--live-ai');
const required = live ? ['OPENAI_API_KEY', 'AI_MODEL'] : [];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(
  live
    ? 'Live AI environment keys present.'
    : 'Guided demo requires the DB and DOCUMENTS runtime bindings. Live AI and PostgreSQL are optional until configured.',
);
