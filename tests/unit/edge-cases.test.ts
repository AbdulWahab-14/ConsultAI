import { expect, it } from 'vitest';
import { match, analyze, demoProfile } from '../../lib/matching';
import { programs } from '../../lib/catalog';
it('handles an empty catalog without invented matches', () =>
  expect(analyze(demoProfile, undefined, []).countries).toEqual([]));
it('does not assign a NaN budget score to missing costs', () => {
  const result = match(
    { ...demoProfile, budget: 0 },
    { ...programs[0], tuition: 0, living: 0 },
  );
  expect(Number.isFinite(result.score)).toBe(true);
  expect(result.unknown.join(' ')).toContain('cost estimate');
});
it('gates a stored academic minimum', () =>
  expect(
    match(
      { ...demoProfile, marks: 70 },
      { ...programs[0], academic: 80 },
    ).issues.join(' '),
  ).toContain('80% minimum'));
