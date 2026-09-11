'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { newWorkspace } from '@/lib/workspace-state';
import { profileSchema } from '@/lib/validation';
import { countries } from '@/lib/catalog';
export default function ProfileOnboarding() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <Link href="/">ConsultAI</Link>
      <h1>Create your study profile</h1>
      <p>
        Start with your own education, goals and budget. Your analysis will use
        the details you save here.
      </p>
      <p className="muted">
        Your profile is private to this browser, or your account when signed in.
      </p>
      <form
        className="card profile-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setBusy(true);
          setError('');
          try {
            const profile = profileSchema.parse({
              name: data.get('name'),
              citizenship: data.get('citizenship'),
              qualification: data.get('qualification'),
              degree: data.get('degree'),
              field: data.get('field'),
              marks: Number(data.get('marks')),
              budget: Number(data.get('budget')),
              ielts: Number(data.get('ielts') || 0),
              intake: data.get('intake') || '',
              preferred: data.getAll('preferred'),
              german: data.has('german'),
              priorUniversity: data.has('priorUniversity'),
              components: [],
            });
            const response = await fetch('/api/workspace', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...newWorkspace(),
                profile,
                profileCompleted: true,
              }),
            });
            if (!response.ok)
              throw new Error(
                'Could not save your profile. Check the entered details and retry.',
              );
            window.location.assign('/dashboard');
          } catch {
            setError(
              'Could not save your profile. Check the entered details and retry.',
            );
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          {(
            [
              ['name', 'Your name'],
              ['citizenship', 'Citizenship'],
              ['qualification', 'Current education / qualification'],
              ['field', 'Subject you want to study'],
            ] as const
          ).map(([name, label]) => (
            <label className="field" key={name}>
              {label}
              <Input name={name} required maxLength={80} />
            </label>
          ))}
          <label className="field">
            Target degree
            <select name="degree" required defaultValue="" className="choice">
              <option value="" disabled>
                Select a degree
              </option>
              {['Bachelor', 'Master', 'PhD'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="field" htmlFor="onboarding-marks">
            Academic result (%)
            <Input
              id="onboarding-marks"
              name="marks"
              type="number"
              min={0}
              max={100}
              step="any"
              required
            />
          </label>
          <label className="field" htmlFor="onboarding-budget">
            Available first-year funds (PKR)
            <Input
              id="onboarding-budget"
              name="budget"
              type="number"
              min={0}
              max={1000000000}
              required
            />
          </label>
          <label className="field" htmlFor="onboarding-ielts">
            IELTS overall (leave blank if not taken)
            <Input
              id="onboarding-ielts"
              name="ielts"
              type="number"
              min={0}
              max={9}
              step={0.5}
            />
          </label>
          <label className="field" htmlFor="onboarding-intake">
            Preferred intake (optional)
            <Input id="onboarding-intake" name="intake" maxLength={100} />
          </label>
        </div>
        <h3>Preferred destinations (optional)</h3>
        <div className="row wrap">
          {countries.map((c) => (
            <label className="check-label" key={c}>
              <input name="preferred" value={c} type="checkbox" />
              {c}
            </label>
          ))}
        </div>
        <label className="check-label">
          <input type="checkbox" name="german" />I have German-language evidence
          to review
        </label>
        <label className="check-label">
          <input type="checkbox" name="priorUniversity" />I have completed at
          least one year of university study
        </label>
        {error && <p role="alert">{error}</p>}
        <Button type="submit" className="button primary" disabled={busy}>
          {busy ? 'Saving your profile…' : 'Save profile and analyze'}
        </Button>
      </form>
    </main>
  );
}
