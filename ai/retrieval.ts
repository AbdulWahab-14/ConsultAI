import { sources, type Source } from '@/lib/catalog';
export function retrieve(
  query: string,
  now = new Date(),
  catalog: Source[] = sources,
): Source[] {
  const country = /korea|korean|kaist/i.test(query)
    ? 'South Korea'
    : /german|germany|daad/i.test(query)
      ? 'Germany'
      : /\buk\b|britain|united kingdom|sheffield/i.test(query)
        ? 'United Kingdom'
        : null;
  const topic = /visa|immigration|bank/i.test(query)
    ? 'visa'
    : /scholarship|funding|stipend/i.test(query)
      ? 'scholarship'
      : null;
  const tokens = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2);
  return catalog
    .filter(
      (s) =>
        s.status === 'VERIFIED' &&
        new Date(s.reviewDueAt) >= now &&
        (!country || s.country === country) &&
        (!topic || s.topic === topic),
    )
    .map((s) => ({
      s,
      score: tokens.reduce(
        (n, t) =>
          n + ((s.title + ' ' + s.text).toLowerCase().includes(t) ? 1 : 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((r) => r.s);
}
export type Claim = {
  text: string;
  kind: 'FACT' | 'ESTIMATE' | 'RECOMMENDATION' | 'UNVERIFIED';
  sourceIds: string[];
  quote: string | null;
};
export function validateClaims(claims: Claim[], context: Source[]): Claim[] {
  return claims.map((c) => {
    const cited = c.sourceIds.map((id) => context.find((s) => s.id === id));
    if (
      c.kind === 'FACT' &&
      (!c.quote ||
        !cited.length ||
        cited.some((s) => !s) ||
        !cited.some((s) => s?.text.includes(c.quote!)))
    )
      return {
        text: 'I do not currently have verified evidence for this claim.',
        kind: 'UNVERIFIED',
        sourceIds: [],
        quote: null,
      };
    if (c.sourceIds.some((id) => !context.some((s) => s.id === id)))
      return { ...c, kind: 'UNVERIFIED', sourceIds: [], quote: null };
    if (
      c.kind !== 'FACT' &&
      /\d|£|₩|must|eligible|requirement|deadline|visa approval/i.test(c.text)
    )
      return {
        text: 'This suggestion needs verification against official evidence before you act.',
        kind: 'UNVERIFIED',
        sourceIds: [],
        quote: null,
      };
    return c;
  });
}
