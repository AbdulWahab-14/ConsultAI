# AI system

`AIProvider` separates structured generation and consultation from the vendor implementation. `GeminiProvider` is the default; set `GEMINI_API_KEY` and `AI_MODEL`. Gemini uses generateContent with JSON Schema, rejects blocked/truncated responses and passes every claim through the same Zod and citation validation. The document coach uses the same provider. `AI_PROVIDER=openai` retains the existing OpenAI adapter. Add a future Groq adapter by extending `ValidatedProvider` and registering a factory; application routes remain unchanged. Provider selection is explicit: missing keys or unknown providers do not send data to another vendor. Embedding configuration is independent through `EMBEDDING_PROVIDER` and `EMBEDDING_MODEL`. `OpenAIProvider` uses the Responses API with strict JSON Schema output, Zod validation, explicit model configuration, bounded context/output, request timeouts and `store:false`. Only the server accesses credentials.

The consultant prompt treats retrieved text as untrusted evidence. The provider receives the saved profile, saved university IDs, application context, the latest eight messages and at most four evidence sources. Deterministic match results remain outside model control.

## Evidence guard

Every factual output must cite a retrieved source ID and carry an exact quote present in that source. The displayed factual text is the validated quote, rather than a model paraphrase that might overstate it. Unknown IDs and unsupported quotes become an explicit unverified response. Nonfactual output containing numeric or mandatory-policy claims is conservatively qualified. This is an intentionally restrictive guard, not a proof of semantic truth or a complete hallucination detector.

Quotes can only support what the stored source actually says. Source freshness and review status are filtered before retrieval. URLs are supplied by the application catalog, never accepted from model output.

The guided path handles fit, cost estimates, source-backed country questions and refusals without claiming to be generative AI. It refuses document falsification and admission/visa guarantees. Missing official evidence is reported directly. Live provider failures return a friendly retryable error; they are not silently replaced with fabricated model output.

Document AI validates observations against exact quotes from the uploaded text and offers authentic writing improvements. Without configured AI, the application labels a small keyword-based writing checklist as rule-based; it is neither an authenticity score nor an admissions assessment.

## Operational boundaries

Live AI has not been verified without a real `GEMINI_API_KEY` and `AI_MODEL`. Streaming, automatic structured profile extraction from chat, conversation summarization, separate extraction/classification models and a semantic entailment evaluator remain to be implemented. Existing unit evaluations cover guarantees, falsification, missing sources, freshness, citations and cost labeling.

Implementation follows [OpenAI structured-output documentation](https://developers.openai.com/api/docs/guides/structured-outputs).

Provider errors, safety blocks, timeouts and invalid structured responses fall back to the labeled guided consultation or rule-based document review. Citation failures are downgraded by the existing validator. No live Gemini request has been verified without credentials.

Gemini transport follows the [generateContent reference](https://ai.google.dev/api/generate-content) and [embedding reference](https://ai.google.dev/api/embeddings). Default embeddings use `gemini-embedding-001`, 1536 dimensions and query/document task types; vectors are normalized and validated before use.
