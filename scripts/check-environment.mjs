const live = process.argv.includes('--live-ai');
const provider = (process.env.AI_PROVIDER || 'gemini').trim().toLowerCase();
const keys = { gemini: 'GEMINI_API_KEY', openai: 'OPENAI_API_KEY' };
if (live && !Object.hasOwn(keys, provider)) {
  console.error(
    'Unsupported AI_PROVIDER. Register an adapter before enabling it.',
  );
  process.exit(1);
}
const required = live ? [keys[provider], 'AI_MODEL'] : [];
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
