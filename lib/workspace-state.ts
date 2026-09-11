import { demoProfile, type Profile } from './matching';
import type { State } from '@/components/workspace';
export const emptyProfile: Profile = {
  name: '',
  citizenship: '',
  qualification: '',
  marks: 0,
  degree: '',
  field: '',
  budget: 0,
  ielts: 0,
  intake: '',
  preferred: [],
  german: false,
  priorUniversity: false,
  components: [],
};
export function newWorkspace(): State {
  return {
    profile: structuredClone(emptyProfile),
    profileCompleted: false,
    saved: [],
    compare: [],
    applications: [],
    checks: [],
    messages: [],
    reports: [],
  };
}
export function restoreWorkspace(state: State): State {
  if (state.profileCompleted === true) return state;
  // Older demo visits could persist the seed through chat without ever creating a profile.
  const seed = Object.keys(demoProfile).every(
    (key) =>
      JSON.stringify(state.profile[key as keyof Profile]) ===
      JSON.stringify(demoProfile[key as keyof Profile]),
  );
  if (seed || state.profileCompleted === false || !state.profile.name.trim())
    return newWorkspace();
  return { ...state, profileCompleted: true };
}
