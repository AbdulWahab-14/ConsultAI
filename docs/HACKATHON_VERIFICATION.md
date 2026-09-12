# ConsultAI production verification - final release

Verified: 12 September 2026.
Public entry: https://consultai-study-strategy.mrkidz6667.chatgpt.site/profile
Admin: https://consultai-study-strategy.mrkidz6667.chatgpt.site/admin

## Deployment

- Version 6, successful public deployment.
- Application commit: 1eacf0995840696535bdc908479a09c8489d4e30
- Deployment: appgdep_6aa527e194b881918aabbd600ac4b2dd
- Environment revision: 4.
- AI_PROVIDER=gemini, AI_MODEL=gemini-3.6-flash.
- EMBEDDING_PROVIDER=gemini, EMBEDDING_MODEL=gemini-embedding-001.
- GEMINI_API_KEY configured as a server secret; no key is included here.
- ADMIN_EMAILS=mrkidz6667@gmail.com.
- Working tree clean; source and verification documentation pushed.

## Passed checks

- Typecheck and lint.
- 51 unit tests, including SQLite admin CRUD/review/change-detection and citation/embedding safeguards.
- Production build.
- All seven production browser/API tests on version 6, 2.8 minutes: profile creation and isolation; country/university/scholarship matching; Gemini live mode and D1 semantic retrieval; official clickable citations; saved shortlist and comparison; what-if simulation; persistent roadmap; document review/download/delete isolation; desktop and 390px mobile layouts.
- Additional production admin API restrictions, including rejection of forged identity headers.
- Production catalog contains six universities, 14 source records with hashes, four scholarship leads and three visa overviews; 13 reviewed source summaries indexed using Gemini embeddings.
- Final live dashboard check confirms scholarship count derives from degree/destinations and IELTS prompts recognize completed component scores.
- Source drawer, blank profile, personalized dashboard and mobile pages visually inspected. Physical iOS/Android devices were not used.

## Admin verification and data limits

The owner confirmed that the production admin page opens. Authenticated admin CRUD and source review were tested with a controlled administrator fixture and real local SQLite. Production tests verified access restrictions; they did not write through the owner's signed-in browser.

Source refresh captures HTML/plain text from approved official hosts. Changed content enters review and never automatically replaces published critical facts. Explicit approval stores the reviewed summary, capture/summary hashes and updated embeddings transactionally. Admin catalog editors cover university/program records, scholarships, visas and sources.

Current KAIST admission guidance remains flagged for review. No current German scholarship call is claimed verified. Published tuition is separate from PKR scenario budgets. Unknown deadlines and international qualification equivalences remain unverified. Scholarship continuation GPA is not an entrance GPA. Visa records are official overviews, not complete embassy-specific checklists.

## External action

No additional key, database account, hosting setup or deployment action is required. Share the profile URL. Each new browser session starts with an empty profile and must save its own education/goals before personalized analysis.

For routine knowledge maintenance, sign in at /admin, refresh the official source, inspect the captured evidence, and explicitly approve the reviewed summary and any corresponding structured catalog edits.
