# Security boundaries

- Production identity comes from the Sites dispatcher and its generated SIWC helpers. Never expose this Worker behind a proxy that permits clients to forge `oai-authenticated-*` headers. Local preview identity is not a production authentication mechanism.
- Anonymous demos use 256-bit random HttpOnly, SameSite=Lax cookies. Production cookies are Secure. Demo state is keyed separately from signed-in user state.
- Administrator endpoints check a server-side `ADMIN_EMAILS` allowlist. No demo administrator password or client role toggle exists.
- Mutations require an exact same-origin Origin header. Inputs are schema validated and body sizes are bounded while streaming, not only by Content-Length.
- Database values use prepared statements. PostgreSQL vector literals are validated numeric arrays passed as parameters.
- D1 rate limits use atomic per-identity/minute counters for chat, document processing, ingestion and writes. This is not a complete distributed abuse-prevention service; rotateable anonymous sessions warrant platform-level limits for public commercial launch.
- Student documents are private R2 objects. List/download/delete queries enforce ownership. Raw bucket URLs are never exposed. Download responses use attachment, text/plain, nosniff and private/no-store headers.
- User and AI content render as text, not raw HTML. Source summaries are untrusted evidence and never instructions. Model credentials and private document text are not logged.
- Source ingestion restricts domains and protocols, disallows redirects, limits response bytes and never publishes critical facts automatically.
- Catalog changes and source reviews record administrator audit entries.

## Production work still required

Independent security review, retention policy and account deletion, backup/restore drills, full privacy/terms documents, global abuse controls, malware scanning for future binary uploads, alerting and load testing. The app currently accepts text documents only. There is no payment processing.

Use `npm audit` to inspect dependency advisories. Do not apply forceful dependency downgrades just to silence development-tool advisories. Runtime and build-tool risk must be assessed separately. Live AI, external PostgreSQL and hosted identity require integration verification once credentials/access are available.
