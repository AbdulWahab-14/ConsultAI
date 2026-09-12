import { programs, countries, type Program } from './catalog';
export type Profile = {
  name: string;
  citizenship: string;
  qualification: string;
  marks: number;
  degree: string;
  field: string;
  budget: number;
  ielts: number;
  intake: string;
  preferred: string[];
  german: boolean;
  priorUniversity: boolean;
  components: number[];
};
export const demoProfile: Profile = {
  name: 'Taha',
  citizenship: 'Pakistan',
  qualification: 'FSc / Intermediate',
  marks: 82,
  degree: 'Bachelor',
  field: 'Computer Science',
  budget: 2500000,
  ielts: 6.5,
  intake: 'Next available intake',
  preferred: countries,
  german: false,
  priorUniversity: false,
  components: [],
};
export const defaultWeights = {
  academics: 30,
  budget: 25,
  language: 15,
  program: 15,
  scholarship: 10,
  preference: 5,
};
export type Weights = typeof defaultWeights;
export function match(p: Profile, u: Program, w: Weights = defaultWeights) {
  const total = u.tuition + u.living;
  const budgetCoverage = total > 0 ? p.budget / total : 0;
  const factors = {
    academics: Math.min(1, p.marks / 100),
    budget: Math.min(1, budgetCoverage),
    language: u.ielts ? Math.min(1, p.ielts / u.ielts) : 0.5,
    program:
      p.field.toLowerCase() === u.field.toLowerCase() && p.degree === u.degree
        ? 1
        : 0,
    scholarship: u.scholarship ? 0.5 : 0,
    preference: p.preferred.includes(u.country) ? 1 : 0,
  };
  const breakdown = (Object.keys(w) as (keyof Weights)[]).map((key) => ({
    key,
    score: Math.round(factors[key] * w[key] * 10) / 10,
    max: w[key],
    reason:
      key === 'academics'
        ? 'Profile strength only; qualification equivalence is unconfirmed.'
        : key === 'budget'
          ? total > 0
            ? `${Math.round(budgetCoverage * 100)}% of the first-year planning estimate covered; no scholarship assumed.`
            : 'Cost estimate missing; budget compatibility cannot be assessed.'
          : key === 'language'
            ? u.ielts
              ? `Stored IELTS overall requirement: ${u.ielts}; component scores are checked separately.`
              : 'Current English threshold unverified; neutral partial score.'
            : key === 'program'
              ? 'Exact field and degree comparison.'
              : key === 'scholarship'
                ? 'Opportunity indicator only; no award or eligibility assumed.'
                : 'Your selected destinations.',
  }));
  const issues: string[] = [];
  const unknown: string[] = [];
  if (total === 0) unknown.push('A complete cost estimate is needed.');
  if (u.academic !== null && p.marks < u.academic)
    issues.push(
      `Academic result is below the stored ${u.academic}% minimum; qualification equivalence still requires confirmation.`,
    );
  if (u.ielts && p.ielts < u.ielts)
    issues.push(
      `IELTS ${Number((u.ielts - p.ielts).toFixed(1))} below the stored overall requirement.`,
    );
  if (u.ieltsComponentMin != null) {
    if (p.components.length !== 4)
      unknown.push('Four IELTS component scores needed.');
    else if (p.components.some((v) => v < u.ieltsComponentMin!))
      issues.push(
        `An IELTS component is below ${u.ieltsComponentMin.toFixed(1)}.`,
      );
  }
  if (
    u.country === 'Germany' &&
    p.citizenship === 'Pakistan' &&
    p.qualification.includes('FSc') &&
    !p.priorUniversity
  )
    issues.push(
      'HSSC route: prior university study / entrance pathway needs resolution.',
    );
  if (u.language === 'German' && !p.german)
    issues.push('German-language evidence missing.');
  if (p.degree !== u.degree || p.field.toLowerCase() !== u.field.toLowerCase())
    issues.push('Requested field or degree does not match this program.');
  if (p.budget < total)
    unknown.push(
      `Estimated funding gap: PKR ${Math.round(total - p.budget).toLocaleString('en-PK')}.`,
    );
  unknown.push(
    'Academic equivalence and current intake require university review.',
  );
  if (!u.ielts) unknown.push('Current language policy needs verification.');
  const score = Math.round(breakdown.reduce((s, b) => s + b.score, 0));
  return {
    ...u,
    score,
    breakdown,
    issues,
    unknown,
    total,
    status: issues.length
      ? 'Missing Requirement'
      : unknown.length
        ? 'Needs Verification'
        : score >= 85
          ? 'Strong Match'
          : score >= 70
            ? 'Good Match'
            : 'Possible Match',
  };
}
export function analyze(
  p: Profile,
  w = defaultWeights,
  catalog: Program[] = programs,
) {
  const universities = catalog
    .map((u) => match(p, u, w))
    .sort((a, b) => b.score - a.score);
  return {
    universities,
    countries: countries
      .filter((country) => universities.some((u) => u.country === country))
      .map((country) => ({
        ...universities
          .filter((u) => u.country === country)
          .reduce((a, b) => (b.score > a.score ? b : a)),
      }))
      .sort((a, b) => b.score - a.score),
    completedStages: [
      'Academics analyzed',
      'Language gates checked',
      'Budget calculated',
      'Catalog matched',
      'Scholarship evidence linked',
      'Visa preparation reviewed',
      'Strategy generated',
    ],
  };
}
export function profileStrength(p: Profile) {
  return Math.round(
    [
      p.name,
      p.citizenship,
      p.qualification,
      p.marks,
      p.degree,
      p.field,
      p.budget,
      p.ielts,
      p.intake,
      p.components.length === 4,
    ].filter(Boolean).length * 10,
  );
}
