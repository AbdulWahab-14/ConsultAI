import { analyze, type Profile } from '@/lib/matching';
import { money, sources, programs } from '@/lib/catalog';
import { defaultWeights } from '@/lib/matching';
import { retrieve } from './retrieval';
export function guided(
  message: string,
  p: Profile,
  catalog = { sources, programs, weights: defaultWeights },
) {
  if (
    /fake|forge|fabricat|falsif/i.test(message) &&
    /bank|statement|document|record|transcript/i.test(message)
  )
    return 'I cannot help fabricate financial or academic documents. Use authentic records and ask the institution which legitimate alternatives it accepts.';
  if (
    /guarantee|100%|certain/i.test(message) &&
    /visa|admission|scholarship/i.test(message)
  )
    return 'I cannot guarantee admission, a scholarship or a visa. Fit scores compare planning compatibility; visa readiness only measures preparation.';
  const context = retrieve(message, new Date(), catalog.sources);
  if (/visa|deadline|requirement|scholarship|korea|german/i.test(message)) {
    return context.length
      ? context
          .map((s) => `${s.text}\nSource: ${s.organization} — ${s.url}`)
          .join('\n\n')
      : 'I do not currently have a verified official source for that question. Confirm the current requirements with the institution or immigration authority.';
  }
  const r = analyze(p, catalog.weights, catalog.programs);
  if (!r.universities.length)
    return 'There are no programs in the current catalog. Please check again after the catalog is reviewed.';
  if (/cheap|cost|budget/i.test(message)) {
    const cheapest = [...r.universities].sort((a, b) => a.total - b.total)[0];
    return `Estimate: ${cheapest.name} has the lowest stored first-year planning scenario at ${money(cheapest.total)}. Your available funds are ${money(p.budget)}. These are illustrative planning costs, not current fee quotations, and no scholarship is deducted. ${cheapest.caveat}`;
  }
  return `${p.name}, ${r.countries[0].country} leads this small catalog at ${r.countries[0].score}/100 planning fit for your ${p.degree} in ${p.field}. ${r.countries[0].caveat}\n\n${p.components.length !== 4 ? 'What are your four IELTS component scores? They can change language eligibility.' : 'Next, confirm your qualification equivalence and current intake with each university.'}`;
}
