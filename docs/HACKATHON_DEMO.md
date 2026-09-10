# Hackathon demo

## Three minutes

1. **0:00–0:25 — Problem.** Open `/`. Explain that students currently reconcile consultant advice, university requirements, scholarship portals and immigration pages themselves.
2. **0:25–0:55 — Personal context.** Open `/demo`. The profile is Pakistan, FSc 82%, Computer Science bachelor, IELTS 6.5, PKR 2.5m. Click **Analyze My Future**. The displayed scores are real calculations; do not claim the example 89/79/67 numbers from the original brief.
3. **0:55–1:35 — Explainability and trust.** Open KAIST's detail. Show the factor breakdown, funding gap, unresolved requirements and scholarship conditions. Open the source drawer. Germany's FSc and German-language issues are explicit.
4. **1:35–2:05 — What if.** Compare universities. Set IELTS to 7 in `/simulator`. Explain why a higher overall score may not unlock anything when component scores, qualification recognition and funding are unresolved. No artificial improvement is fabricated.
5. **2:05–2:40 — Action.** Save a university, create an application, check a preparation task, reload and show persistence. Open `/report` and print/save as PDF.
6. **2:40–3:00 — Trust operations.** Open the read-only knowledge view or use your authorized administrator account. Explain the captured-source review queue and why critical changes require approval.

## Five minutes

Add a consultant question about Korea, a missing Korean visa-source question, and an authentic SOP text review. Show private document download/deletion. With live AI configured, disclose which answers are generative; otherwise explicitly say guided mode. For an authorized admin, fetch a small official page, inspect source/current/proposed summaries, and demonstrate review without pretending extraction is automatic.

## Likely judge questions

- **Does the LLM assign the scores?** No. Typed deterministic code does, with configurable weights and independent gates.
- **Are all costs verified?** No. The initial PKR costs are labeled planning scenarios. Specific reviewed facts have inspectable official sources.
- **Can it guarantee a visa?** No. Readiness is a self-reported preparation checklist, not approval probability.
- **Is RAG live?** Default: structured and keyword evidence retrieval. Optional pgvector code and indexing are included; only claim semantic retrieval after configuring and testing PostgreSQL and embeddings.
- **How do you stop fabricated citations?** Only retrieved IDs are accepted, and displayed factual quotes must occur in evidence. This is restrictive evidence checking, not a complete truth proof.
- **Why only three institutions?** The initial dataset prioritizes real institutions and transparent uncertainty over fabricated coverage.
- **How does it make money?** Future paid guidance/document assistance and B2B consultant licensing. Payments are not implemented.

## Honest demo boundaries

No fake testimonials, user metrics, awards, current deadlines or approval odds. Catalog coverage is intentionally small. Document input is text only. Report saves preserve profile snapshots, not immutable full catalog versions. No public share token, streaming chat, Google OAuth or billing workflow is implemented. Commercial launch needs the work listed in `IMPLEMENTATION_STATUS.md`.
