# Data verification

Initial evidence was researched on 9 September 2026 using official government, university and DAAD pages. Review applies to a specific summary, never automatically to all fields of an institution.

| Source                                                                                                    | Reviewed information                                                                                                   |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [UK Government](https://www.gov.uk/student-visa/money)                                                    | Course-fee evidence, London/outside-London living-fund amounts and holding period; circumstances and exceptions matter |
| [DAAD Pakistan](https://www.daad.pk/en/study-research-in-germany/eight-steps-to-germany/getting-started/) | HSSC holder pathway requiring prior university study for the stated route; institution decides equivalence             |
| [KAIST scholarship](https://admission.kaist.ac.kr/intl-undergraduate/support/scholarships/kaist/)         | Conditional admitted-student tuition, stipend, insurance and continuation GPA                                          |
| [Study in Korea](https://studyinkorea.go.kr/ko/plan/scholarship.do?tab=gks-tab1)                          | Existence of GKS; current intake criteria and individual eligibility are not established by this overview              |
| [Sheffield CS](https://sheffield.ac.uk/undergraduate/courses/2026/computer-science-bsc)                   | Program identity and stored English criteria for the listed cycle; future intake and FSc equivalence need review       |
| [H-BRS](https://www.h-brs.de/en/inf/study/bachelor/computer-science)                                      | Program identity; English-only bachelor route is not verified                                                          |

KAIST's current application guide is linked but marked `NEEDS_REVIEW`. Its older recommended IELTS score is not treated as a current mandatory gate. Tuition/living costs in PKR are illustrative first-year scenarios, not official quotations or live currency conversions. No application deadline is fabricated.

## Ingestion and change review

The administrator may fetch HTTPS URLs from the existing official domain allowlist. Credentials, custom ports, redirects and nontext media are rejected. Fetches have a 15-second timeout and 1 MB response cap. Script/style tags and markup are removed; content is SHA-256 hashed. Identical content is not inserted twice. Changed content is flagged `SOURCE_CHANGED`.

The review screen compares captured source text with the existing summary. Approval requires an explicit structured summary using the captured URL; the server sets verification time and writes an audit record. Rejected or unreviewed captures do not enter student retrieval. This is a human review workflow, not automatic AI verification.

Knowledge health combines reviewed coverage (35%), freshness (35%) and selected program-field completeness (30%). It is an operational indicator, not a guarantee of factual accuracy.

Remaining: field-level source references for every program value, PDF extraction, automated structured extraction suggestions, effective-date/version modeling on all records and scheduled source rechecks.
