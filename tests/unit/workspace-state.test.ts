import { describe, expect, it } from 'vitest';
import { newWorkspace, restoreWorkspace } from '../../lib/workspace-state';
import { demoProfile } from '../../lib/matching';
describe('new visitor profiles', () => {
  it('starts without the example identity or education', () => {
    const state = newWorkspace();
    expect(state.profileCompleted).toBe(false);
    expect(state.profile.name).toBe('');
    expect(state.profile.qualification).toBe('');
    expect(state.profile.degree).toBe('');
    expect(state.profile.preferred).toEqual([]);
  });
  it('does not share mutable profile data between visitors', () => {
    const a = newWorkspace();
    const b = newWorkspace();
    a.profile.name = 'Visitor A';
    a.profile.preferred.push('Germany');
    expect(b.profile.name).toBe('');
    expect(b.profile.preferred).toEqual([]);
  });
  it('reopens old sample-only sessions as empty onboarding', () => {
    const old = {
      ...newWorkspace(),
      profileCompleted: undefined,
      profile: demoProfile,
    };
    expect(restoreWorkspace(old)).toEqual(newWorkspace());
  });
  it('preserves genuinely customized legacy profiles and explicitly completed profiles', () => {
    const old = {
      ...newWorkspace(),
      profileCompleted: undefined,
      profile: { ...demoProfile, name: 'Visitor A' },
    };
    expect(restoreWorkspace(old).profile.name).toBe('Visitor A');
    expect(restoreWorkspace(old).profileCompleted).toBe(true);
    const completed = { ...old, profileCompleted: true, profile: demoProfile };
    expect(restoreWorkspace(completed)).toBe(completed);
  });
});
