'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  LayoutDashboard,
  MessageSquare,
  GraduationCap,
  Globe2,
  Bookmark,
  GitCompareArrows,
  ScanLine,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  SlidersHorizontal,
  FileText,
  Route,
  FolderOpen,
  Settings,
  Check,
  Search,
  Bell,
  Send,
  Plus,
  Printer,
  ExternalLink,
  TriangleAlert,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  analyze,
  profileStrength,
  defaultWeights,
  type Profile,
} from '@/lib/matching';
import {
  sources as seedSources,
  programs as seedPrograms,
  countries,
  flags,
  money,
  type Source,
} from '@/lib/catalog';
import DocumentCoach from './document-coach';
import Admin from './admin-center';
import ProfileOnboarding from './profile-onboarding';
import { newWorkspace } from '@/lib/workspace-state';
const nav = [
  ['dashboard', 'Overview', LayoutDashboard],
  ['consultant', 'AI consultant', MessageSquare],
  ['countries', 'Country matches', Globe2],
  ['universities', 'University explorer', GraduationCap],
  ['scholarships', 'Scholarship radar', Sparkles],
  ['saved', 'My shortlist', Bookmark],
  ['compare', 'Compare universities', GitCompareArrows],
  ['simulator', 'What-if simulator', SlidersHorizontal],
  ['applications', 'Applications', FolderOpen],
  ['visa', 'Visa readiness', ShieldCheck],
  ['roadmap', 'My roadmap', Route],
  ['report', 'Strategy report', FileText],
  ['documents', 'Document & SOP coach', FileText],
] as const;
export type AppRecord = {
  id: string;
  universityId: string;
  status: string;
  tasks: string[];
};
export type State = {
  profileCompleted?: boolean;
  profile: Profile;
  saved: string[];
  compare: string[];
  applications: AppRecord[];
  checks: string[];
  messages: { role: 'user' | 'assistant'; text: string }[];
  reports: { id: string; createdAt: string; profile: Profile }[];
};
const initial: State = newWorkspace();
export function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      {label}
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger className="choice">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((x) => (
            <SelectItem key={x} value={x}>
              {x}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
export default function Workspace({ route }: { route: string }) {
  const [sources, setSources] = useState(seedSources);
  const [programs, setPrograms] = useState(seedPrograms);
  const [weights, setWeights] = useState(defaultWeights);
  useEffect(() => {
    fetch('/api/catalog')
      .then(
        (r) =>
          r.json() as Promise<{
            sources: typeof seedSources;
            programs: typeof seedPrograms;
            weights: typeof defaultWeights;
          }>,
      )
      .then((d) => {
        setSources(d.sources);
        setPrograms(d.programs);
        setWeights(d.weights);
      })
      .catch(() => {});
  }, []);
  const page = route === 'demo' ? 'dashboard' : route;
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const [consultantStatus, setConsultantStatus] = useState(
    'Answers distinguish cited evidence, estimates and guidance.',
  );
  const [source, setSource] = useState<Source | null>(null);
  const [scan, setScan] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('All countries');
  const [draft, setDraft] = useState('');
  const [simulation, setSimulation] = useState<Profile | null>(null);
  const [account, setAccount] = useState('Demo workspace');
  const [reportId, setReportId] = useState<string | null>(null);
  const p =
    page === 'report' && reportId
      ? state.reports.find((r) => r.id === reportId)?.profile || state.profile
      : state.profile;
  const result = analyze(p, weights, programs);
  const top = result.countries[0] || {
    country: 'No pathway available',
    score: 0,
    scholarship: false,
    caveat: 'No program is currently in the catalog.',
  };
  useEffect(() => {
    fetch('/api/workspace')
      .then(async (r) => {
        if (!r.ok) throw Error();
        return r.json() as Promise<{ state: State; account: string }>;
      })
      .then((d) => {
        setState(d.state);
        setAccount(d.account);
        setReady(true);
      })
      .catch(() =>
        setNotice('Workspace could not load. Please reload to retry.'),
      );
  }, []);
  async function persist(next: State) {
    const previous = state;
    setState(next);
    setNotice('');
    setBusy(true);
    try {
      const r = await fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!r.ok) throw Error();
      setState(next);
      setNotice('Changes saved.');
    } catch {
      setState(previous);
      setNotice('Could not save. Please retry.');
    } finally {
      setBusy(false);
    }
  }
  function toggle(key: 'saved' | 'compare', id: string) {
    if (
      key === 'compare' &&
      !state.compare.includes(id) &&
      state.compare.length >= 4
    ) {
      setNotice('Compare up to four universities.');
      return;
    }
    void persist({
      ...state,
      [key]: state[key].includes(id)
        ? state[key].filter((x) => x !== id)
        : [...state[key], id],
    });
  }
  function apply(id: string) {
    if (state.applications.some((a) => a.universityId === id)) {
      setNotice('This university is already in your applications.');
      return;
    }
    void persist({
      ...state,
      applications: [
        ...state.applications,
        {
          id: crypto.randomUUID(),
          universityId: id,
          status: 'Researching',
          tasks: [],
        },
      ],
    });
  }
  const sourceLink = (id: string) => (
    <button
      className="source-link"
      key={id}
      onClick={() => setSource(sources.find((s) => s.id === id) || null)}
    >
      {sources.find((s) => s.id === id)?.status === 'VERIFIED' ? (
        <ShieldCheck size={14} />
      ) : (
        <TriangleAlert size={14} />
      )}{' '}
      {sources.find((s) => s.id === id)?.organization}
      <ArrowUpRight size={12} />
    </button>
  );
  const universityCard = (u: (typeof result.universities)[number]) => (
    <article className="card university" key={u.id}>
      <div className="row between">
        <span className={'uni-monogram ' + u.id}>{u.short}</span>
        <button
          className={
            'icon-button ' + (state.saved.includes(u.id) ? 'selected' : '')
          }
          aria-label={`Save ${u.name}`}
          disabled={!ready || busy}
          onClick={() => toggle('saved', u.id)}
        >
          <Bookmark size={19} />
        </button>
      </div>
      <small>
        {flags[u.country]} {u.city}, {u.country}
      </small>
      <h3>
        <Link href={'/universities/' + u.id}>{u.name}</Link>
      </h3>
      <p>
        {u.field} · {u.degree}
      </p>
      <div className="match-row">
        <strong>
          {u.score}
          <small>/100 fit</small>
        </strong>
        <span className="badge warning">{u.status}</span>
      </div>
      <Progress value={u.score} />
      <div className="uni-facts">
        <span>
          First-year estimate<strong>{money(u.total)}</strong>
        </span>
        <span>
          IELTS overall<strong>{u.ielts ?? 'Needs review'}</strong>
        </span>
      </div>
      <p className="tiny">Planning cost scenario · not a fee quotation</p>
      <div className="row wrap">{u.sourceIds.slice(0, 1).map(sourceLink)}</div>
      <div className="card-actions">
        <Link href={'/universities/' + u.id}>
          Why this matches me <ArrowRight size={15} />
        </Link>
        <button
          disabled={!ready || busy}
          onClick={() => toggle('compare', u.id)}
        >
          {state.compare.includes(u.id) ? 'Added' : 'Compare'}{' '}
          <Plus size={14} />
        </button>
      </div>
    </article>
  );
  async function chat() {
    if (!draft.trim() || busy) return;
    const text = draft;
    setDraft('');
    setBusy(true);
    try {
      const r = await fetch('/api/consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const d = (await r.json()) as {
        error?: string;
        state: State;
        mode: string;
        responseStatus?: string;
      };
      if (!r.ok) throw Error(d.error || 'Consultation unavailable.');
      setState(d.state);
      const status = d.responseStatus || 'Consultation response received.';
      setConsultantStatus(status);
      setNotice(status);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Please retry.');
      setDraft(text);
    } finally {
      setBusy(false);
    }
  }
  if (!ready)
    return (
      <main style={{ padding: 40 }}>
        <output>{notice || 'Loading your workspace…'}</output>
      </main>
    );
  if (!state.profileCompleted && page !== 'admin') return <ProfileOnboarding />;
  return (
    <SidebarProvider>
      <Sidebar className="app-sidebar">
        <SidebarHeader>
          <Link className="brand" href="/">
            <Compass />
            Consult<span>AI</span>
          </Link>
          <span className="workspace-label">YOUR STUDY WORKSPACE</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {nav.map(([href, label, Icon]) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  isActive={page === href}
                  render={<Link href={'/' + href} />}
                >
                  <Icon />
                  <span>{label}</span>
                  {href === 'consultant' && <span className="mini-ai">AI</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Link className="sidebar-link" href="/account">
            <ShieldCheck size={17} /> Account & sign in
          </Link>
          <Link className="sidebar-link" href="/admin">
            <Settings size={17} /> Knowledge center
          </Link>
          <Link className="sidebar-link" href="/profile">
            <span className="avatar">{p.name[0]}</span>
            <span>
              {p.name}
              <small>{account}</small>
            </span>
          </Link>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="app-header">
          <div className="row">
            <SidebarTrigger />
            <span>
              Workspace{' '}
              <span className="crumb">
                / {nav.find((x) => x[0] === page)?.[1] || page}
              </span>
            </span>
          </div>
          <div className="row">
            <Link href="/demo" className="badge">
              Demo mode
            </Link>
            <button
              className="icon-button"
              aria-label="Notifications"
              onClick={() =>
                setNotice(
                  state.applications.length
                    ? 'Review incomplete application tasks and source freshness before submitting.'
                    : 'Start a shortlist to build your application plan.',
                )
              }
            >
              <Bell size={19} />
            </button>
            <Link href="/profile" className="avatar">
              {p.name[0]}
            </Link>
          </div>
        </header>
        <main className="workspace-main" data-ready={ready}>
          {notice && (
            <output className="notice">
              {notice}
              <button
                aria-label="Dismiss message"
                onClick={() => setNotice('')}
              >
                ×
              </button>
            </output>
          )}
          {page === 'dashboard' && (
            <>
              <Heading
                title={`Good afternoon, ${p.name} ↗`}
                text="Your study abroad command center. Big plans, clear next steps."
              />
              <section className="dashboard-hero">
                <div>
                  <span className="badge hero-badge">
                    <Sparkles size={13} /> PERSONALIZED FOR YOU
                  </span>
                  <h2>
                    Your ambition.
                    <br />A global perspective.
                  </h2>
                  <p>
                    {p.qualification} · {p.marks}% · IELTS {p.ielts}
                    <br />
                    {p.field} · {money(p.budget)} available
                  </p>
                  <button
                    className="button mint"
                    disabled={!ready}
                    onClick={() => {
                      setScan(true);
                      setNotice(
                        'Analysis complete. Scores calculated from your profile and the stored catalog.',
                      );
                    }}
                  >
                    <ScanLine size={18} />
                    {scan ? 'Analyze again' : 'Analyze My Future'}
                    <ArrowUpRight size={17} />
                  </button>
                </div>
                <div className="hero-strategy">
                  <div className="row between">
                    <span>YOUR STRONGEST FIT</span>
                    <Compass size={22} />
                  </div>
                  <div className="hero-destination">
                    <span>{flags[top.country]}</span>
                    <h3>{top.country}</h3>
                  </div>
                  <div className="hero-score">
                    {top.score}
                    <span>
                      /100
                      <br />
                      planning fit
                    </span>
                  </div>
                  <Progress value={top.score} />
                  <p>
                    Explore{' '}
                    {top.scholarship
                      ? 'scholarship opportunities'
                      : 'the entry pathway'}{' '}
                    and review funding before committing.
                  </p>
                  <Link href="/countries">
                    Explore your matches <ArrowRight size={16} />
                  </Link>
                </div>
              </section>
              {scan && (
                <section className="scan-results" aria-live="polite">
                  {result.completedStages.map((s) => (
                    <span key={s}>
                      <Check size={15} />
                      {s}
                    </span>
                  ))}
                </section>
              )}
              <section className="metrics">
                {[
                  {
                    Icon: ScanLine,
                    label: 'Profile strength',
                    value: profileStrength(p) + '%',
                    sub: 'Add IELTS component scores',
                    href: 'profile',
                  },
                  {
                    Icon: GraduationCap,
                    label: 'University pathways',
                    value: String(programs.length),
                    sub: 'Curated initial catalog',
                    href: 'universities',
                  },
                  {
                    Icon: Sparkles,
                    label: 'Scholarship leads',
                    value: '2',
                    sub: 'Individual eligibility needs review',
                    href: 'scholarships',
                  },
                  {
                    Icon: FolderOpen,
                    label: 'My applications',
                    value: String(state.applications.length),
                    sub: 'Your next chapter, in progress',
                    href: 'applications',
                  },
                ].map(({ Icon, label, value, sub, href }) => (
                  <Link className="card metric" href={'/' + href} key={label}>
                    <div className="row between">
                      <span>{label}</span>
                      <Icon size={19} />
                    </div>
                    <strong>{value}</strong>
                    <small>{sub}</small>
                  </Link>
                ))}
              </section>
              <div className="dashboard-columns">
                <section className="card">
                  <div className="section-title">
                    <h2>Your country matches</h2>
                    <Link href="/countries">
                      View all <ArrowUpRight size={15} />
                    </Link>
                  </div>
                  <p className="muted">
                    A starting point, with the reasoning in view.
                  </p>
                  {result.countries.map((c, i) => (
                    <Link
                      href="/countries"
                      className="country-row"
                      key={c.country}
                    >
                      <span className="rank">0{i + 1}</span>
                      <span className="flag">{flags[c.country]}</span>
                      <div>
                        <strong>{c.country}</strong>
                        <small>{c.status}</small>
                        <Progress value={c.score} />
                      </div>
                      <strong>
                        {c.score}
                        <small>/100</small>
                      </strong>
                    </Link>
                  ))}
                  <p className="tiny">
                    Fit scores are planning indicators, not admission
                    probabilities.
                  </p>
                </section>
                <section className="card next-steps">
                  <div className="section-title">
                    <h2>Make your next move</h2>
                    <Route size={20} />
                  </div>
                  {[
                    [
                      '01',
                      'Complete the picture',
                      'Add individual English scores.',
                      '/profile',
                    ],
                    [
                      '02',
                      'Find your university fit',
                      'Inspect requirements and save favorites.',
                      '/universities',
                    ],
                    [
                      '03',
                      'Build your strategy',
                      'Create a report to take with you.',
                      '/report',
                    ],
                  ].map(([n, t, d, l]) => (
                    <Link href={l} key={n}>
                      <span>{n}</span>
                      <div>
                        <strong>{t}</strong>
                        <p>{d}</p>
                      </div>
                      <ArrowUpRight size={18} />
                    </Link>
                  ))}
                </section>
              </div>
              <div className="section-title outside">
                <div>
                  <p className="eyebrow">A SHORTLIST WITH SUBSTANCE</p>
                  <h2>Universities to explore</h2>
                </div>
                <Link href="/universities">
                  Explore universities <ArrowRight size={16} />
                </Link>
              </div>
              <div className="university-grid">
                {result.universities.map(universityCard)}
              </div>
            </>
          )}
          {page === 'profile' && (
            <>
              <Heading
                title="Let's map your future."
                text="A little context makes every recommendation more useful."
              />
              <form
                className="card profile-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void persist(state);
                }}
              >
                <div className="form-grid">
                  {(
                    [
                      'name',
                      'citizenship',
                      'qualification',
                      'field',
                      'intake',
                    ] as const
                  ).map((k) => (
                    <label className="field" key={k}>
                      {k}
                      <Input
                        required
                        value={p[k]}
                        onChange={(e) =>
                          setState({
                            ...state,
                            profile: { ...p, [k]: e.target.value },
                          })
                        }
                      />
                    </label>
                  ))}
                  <Choice
                    label="Target degree"
                    value={p.degree}
                    options={['Bachelor', 'Master', 'PhD']}
                    onChange={(v) =>
                      setState({ ...state, profile: { ...p, degree: v } })
                    }
                  />
                  {(['marks', 'ielts', 'budget'] as const).map((k) => (
                    <label className="field" key={k}>
                      {k === 'budget'
                        ? 'Available first-year funds (PKR)'
                        : k === 'marks'
                          ? 'Academic result (%)'
                          : 'IELTS overall'}
                      <Input
                        required
                        type="number"
                        min={0}
                        max={
                          k === 'marks' ? 100 : k === 'ielts' ? 9 : 1000000000
                        }
                        step={k === 'ielts' ? 0.5 : 1}
                        value={p[k]}
                        onChange={(e) =>
                          setState({
                            ...state,
                            profile: { ...p, [k]: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
                <h3>Preferred destinations</h3>
                <div className="row wrap">
                  {countries.map((c) => (
                    <label className="check-label" key={c}>
                      <Checkbox
                        checked={p.preferred.includes(c)}
                        onCheckedChange={(v) =>
                          setState({
                            ...state,
                            profile: {
                              ...p,
                              preferred: v
                                ? [...p.preferred, c]
                                : p.preferred.filter((x) => x !== c),
                            },
                          })
                        }
                      />
                      {flags[c]} {c}
                    </label>
                  ))}
                </div>
                <h3>IELTS components</h3>
                <p className="muted">
                  Leave blank if unknown. Overall IELTS alone cannot confirm
                  eligibility.
                </p>
                <div className="form-grid">
                  {['Listening', 'Reading', 'Writing', 'Speaking'].map(
                    (c, i) => (
                      <label className="field" key={c}>
                        {c}
                        <Input
                          type="number"
                          min={0}
                          max={9}
                          step={0.5}
                          value={p.components[i] ?? ''}
                          onChange={(e) => {
                            const components = [...p.components];
                            components[i] = Number(e.target.value);
                            setState({
                              ...state,
                              profile: { ...p, components },
                            });
                          }}
                        />
                      </label>
                    ),
                  )}
                </div>
                {(['german', 'priorUniversity'] as const).map((k) => (
                  <label className="check-label" key={k}>
                    <Checkbox
                      checked={p[k]}
                      onCheckedChange={(v) =>
                        setState({ ...state, profile: { ...p, [k]: !!v } })
                      }
                    />
                    {k === 'german'
                      ? 'I have German-language evidence to review'
                      : 'I have completed at least one year of university study'}
                  </label>
                ))}
                <Button
                  className="button primary"
                  disabled={!ready || busy}
                  type="submit"
                >
                  Save my profile <Check size={16} />
                </Button>
              </form>
            </>
          )}
          {(page === 'universities' || page === 'saved') && (
            <>
              <Heading
                title={
                  page === 'saved'
                    ? 'Your personal shortlist.'
                    : 'Find your university fit.'
                }
                text="A curated catalog. Clear requirements. Room for your ambition."
              />
              <div className="filter-bar">
                <div className="search">
                  <Search size={18} />
                  <Input
                    aria-label="Search universities"
                    placeholder="Search universities or cities"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Choice
                  label="Destination"
                  value={country}
                  options={['All countries', ...countries]}
                  onChange={setCountry}
                />
                <Link className="button light" href="/compare">
                  Compare ({state.compare.length})
                </Link>
              </div>
              <p className="notice">
                Costs are planning scenarios. Verified badges apply only to
                linked facts, not every field on a card.
              </p>
              <div className="university-grid">
                {result.universities
                  .filter(
                    (u) =>
                      (page !== 'saved' || state.saved.includes(u.id)) &&
                      (country === 'All countries' || u.country === country) &&
                      (u.name + ' ' + u.city)
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                  )
                  .map(universityCard)}
              </div>
              {page === 'saved' && !state.saved.length && (
                <Empty text="Save a university from the explorer to start your shortlist." />
              )}
            </>
          )}
          {page.startsWith('universities/') &&
            (() => {
              const u = result.universities.find(
                (x) => x.id === page.split('/')[1],
              );
              return u ? (
                <>
                  <Heading
                    title={u.name}
                    text={`${u.city}, ${u.country} · ${u.field} · ${u.degree}`}
                  />
                  <div className="actions">
                    <button
                      className="button primary"
                      disabled={!ready || busy}
                      onClick={() => apply(u.id)}
                    >
                      Create application <Plus size={16} />
                    </button>
                    <button
                      className="button light"
                      disabled={!ready || busy}
                      onClick={() => toggle('saved', u.id)}
                    >
                      {state.saved.includes(u.id)
                        ? 'Remove from shortlist'
                        : 'Save university'}
                    </button>
                  </div>
                  <div className="dashboard-columns">
                    <section className="card">
                      <span className="badge warning">{u.status}</span>
                      <h2 className="detail-score">
                        {u.score}
                        <small>/100 planning fit</small>
                      </h2>
                      {u.breakdown.map((b) => (
                        <div className="factor" key={b.key}>
                          <div className="row between">
                            <strong>{b.key}</strong>
                            <span>
                              {b.score}/{b.max}
                            </span>
                          </div>
                          <Progress value={(b.score / b.max) * 100} />
                          <p>{b.reason}</p>
                        </div>
                      ))}
                    </section>
                    <section className="card">
                      <h2>Before you apply</h2>
                      {[...u.issues, ...u.unknown].map((s) => (
                        <p className="risk" key={s}>
                          <TriangleAlert size={17} />
                          {s}
                        </p>
                      ))}
                      <h3>Financial plan · estimate</h3>
                      <p>Tuition: {money(u.tuition)} / year</p>
                      <p>Living costs: {money(u.living)} / year</p>
                      <p>
                        No scholarship deducted. Travel, deposits, insurance and
                        visa expenses may add to your cost.
                      </p>
                      <h3>Documents & next steps</h3>
                      <p>
                        Prepare academic records, passport, language evidence
                        and funding details. Confirm the institution&apos;s
                        complete checklist and next intake.
                      </p>
                      <h3>Official evidence</h3>
                      {u.sourceIds.map(sourceLink)}
                      <p>{u.caveat}</p>
                      <p className="badge warning">
                        Deadline: not verified for your intake
                      </p>
                    </section>
                  </div>
                </>
              ) : (
                <Empty text="This university is not in the catalog." />
              );
            })()}
          {page === 'countries' && (
            <>
              <Heading
                title="Your global study strategy."
                text="Compare the paths, understand the tradeoffs, make your own decision."
              />
              <div className="university-grid">
                {result.countries.map((c) => (
                  <section className="card" key={c.country}>
                    <span className="country-flag">{flags[c.country]}</span>
                    <h2>{c.country}</h2>
                    <h3 className="detail-score">
                      {c.score}
                      <small>/100 fit</small>
                    </h3>
                    <Progress value={c.score} />
                    <p className="badge warning">{c.status}</p>
                    <p>{c.caveat}</p>
                    <p>
                      First-year planning estimate:{' '}
                      <strong>{money(c.total)}</strong>
                    </p>
                    {c.issues.map((s) => (
                      <p className="risk" key={s}>
                        {s}
                      </p>
                    ))}
                    {sources
                      .filter((s) => s.country === c.country)
                      .map((s) => sourceLink(s.id))}
                    <Link
                      className="button light"
                      href={'/universities/' + c.id}
                    >
                      Explore pathway <ArrowRight size={15} />
                    </Link>
                  </section>
                ))}
              </div>
            </>
          )}
          {page === 'simulator' && (
            <>
              <Heading
                title="What if your options changed?"
                text="Adjust your profile and see the same matching engine recalculate immediately."
              />
              <div className="dashboard-columns">
                <section className="card profile-form">
                  {(['ielts', 'marks', 'budget'] as const).map((k) => (
                    <label className="field" key={k}>
                      {k === 'budget' ? 'Budget (PKR)' : k}
                      <Input
                        type="number"
                        min={0}
                        max={
                          k === 'ielts' ? 9 : k === 'marks' ? 100 : 1000000000
                        }
                        step={k === 'ielts' ? 0.5 : 1}
                        value={(simulation || p)[k]}
                        onChange={(e) =>
                          setSimulation({
                            ...(simulation || p),
                            [k]: Math.max(
                              0,
                              Math.min(
                                k === 'ielts'
                                  ? 9
                                  : k === 'marks'
                                    ? 100
                                    : 1000000000,
                                Number(e.target.value),
                              ),
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                  <Choice
                    label="Degree"
                    value={(simulation || p).degree}
                    options={['Bachelor', 'Master', 'PhD']}
                    onChange={(v) =>
                      setSimulation({ ...(simulation || p), degree: v })
                    }
                  />
                  <button
                    className="button light"
                    onClick={() => setSimulation(null)}
                  >
                    Reset scenario
                  </button>
                  <p className="tiny">
                    Simulation does not change your saved profile. Higher IELTS
                    will not solve a funding gap or qualification mismatch.
                  </p>
                </section>
                <section className="card">
                  <h2>Before → after</h2>
                  {analyze(simulation || p, weights, programs).universities.map(
                    (u) => (
                      <div className="country-row" key={u.id}>
                        <div>
                          <strong>{u.name}</strong>
                          <small>{u.status}</small>
                        </div>
                        <strong>
                          {
                            result.universities.find((x) => x.id === u.id)
                              ?.score
                          }{' '}
                          → {u.score}
                        </strong>
                      </div>
                    ),
                  )}
                  <p>
                    New pathways with all known gates cleared:{' '}
                    {Math.max(
                      0,
                      analyze(
                        simulation || p,
                        weights,
                        programs,
                      ).universities.filter((u) => !u.issues.length).length -
                        result.universities.filter((u) => !u.issues.length)
                          .length,
                    )}
                    . Unverified requirements still need review.
                  </p>
                </section>
              </div>
            </>
          )}
          {page === 'compare' && (
            <>
              <Heading
                title="A clearer side-by-side."
                text="Select two to four universities in the explorer to compare."
              />
              {state.compare.length < 2 ? (
                <Empty text="Add at least two universities to your comparison." />
              ) : (
                <section className="card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>What matters</TableHead>
                        {result.universities
                          .filter((u) => state.compare.includes(u.id))
                          .map((u) => (
                            <TableHead key={u.id}>{u.name}</TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        'score',
                        'country',
                        'city',
                        'field',
                        'degree',
                        'tuition',
                        'living',
                        'total',
                        'ielts',
                        'status',
                        'caveat',
                      ].map((k) => (
                        <TableRow key={k}>
                          <TableCell className="capitalize">{k}</TableCell>
                          {result.universities
                            .filter((u) => state.compare.includes(u.id))
                            .map((u) => (
                              <TableCell key={u.id}>
                                {['tuition', 'living', 'total'].includes(k)
                                  ? money(Number(u[k as keyof typeof u]))
                                  : String(
                                      u[k as 'name'] ?? 'Needs verification',
                                    )}
                              </TableCell>
                            ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <h3>Which should you choose?</h3>
                  <p>
                    {
                      result.universities.find((u) =>
                        state.compare.includes(u.id),
                      )?.name
                    }{' '}
                    has the highest planning fit among your selections. Resolve
                    the listed gates and verify full costs before deciding. No
                    option is confirmed safe for admission.
                  </p>
                  <button
                    className="button light"
                    onClick={() => window.print()}
                  >
                    <Printer size={16} /> Print comparison
                  </button>
                </section>
              )}
            </>
          )}
          {page === 'scholarships' && (
            <>
              <Heading
                title="Scholarship radar."
                text="Funding worth investigating, with the conditions in plain sight."
              />
              <div className="dashboard-columns">
                {[
                  {
                    title: 'KAIST Scholarship',
                    id: 'kaist-funding',
                    body: 'Tuition exemption for eight semesters, KRW 350,000 monthly support and medical insurance for admitted international students.',
                    status: 'Possible match · admission required',
                  },
                  {
                    title: 'Global Korea Scholarship',
                    id: 'gks',
                    body: 'Government scholarship pathway. Nationality quotas, age, grades, eligible departments and the current call must be reviewed.',
                    status: 'Missing information · current call needed',
                  },
                ].map((s) => (
                  <section className="card" key={s.id}>
                    <Sparkles className="green" />
                    <h2>{s.title}</h2>
                    <span className="badge warning">{s.status}</span>
                    <p>{s.body}</p>
                    <p>Deadline: no verified current deadline stored.</p>
                    {sourceLink(s.id)}
                    <p className="tiny">
                      No award is deducted from your base budget.
                    </p>
                  </section>
                ))}
              </div>
            </>
          )}
          {(page === 'applications' ||
            page === 'roadmap' ||
            page === 'visa') && (
            <>
              <Heading
                title={
                  page === 'visa'
                    ? 'Prepare with confidence.'
                    : page === 'roadmap'
                      ? 'Your next steps, in order.'
                      : 'Your applications, moving forward.'
                }
                text={
                  page === 'visa'
                    ? 'Readiness measures preparation, never the probability of visa approval.'
                    : 'A practical plan, without invented application deadlines.'
                }
              />
              {page === 'applications' ? (
                <>
                  {!state.applications.length && (
                    <Empty text="Create an application from a university detail page." />
                  )}
                  {state.applications.map((a) => (
                    <section className="card application" key={a.id}>
                      <h2>
                        {programs.find((u) => u.id === a.universityId)?.name}
                      </h2>
                      <Choice
                        label="Application status"
                        value={a.status}
                        options={[
                          'Researching',
                          'Shortlisted',
                          'Preparing',
                          'Ready',
                          'Applied',
                          'Awaiting Decision',
                          'Interview',
                          'Offer Received',
                          'Rejected',
                          'Accepted',
                          'Visa Preparation',
                          'Visa Submitted',
                          'Visa Approved',
                          'Complete',
                        ]}
                        onChange={(v) =>
                          void persist({
                            ...state,
                            applications: state.applications.map((x) =>
                              x.id === a.id ? { ...x, status: v } : x,
                            ),
                          })
                        }
                      />
                      {[
                        'Verify entry requirements',
                        'Prepare transcript',
                        'Prepare passport',
                        'Write authentic SOP',
                        'Request recommendation',
                        'Confirm deadline',
                        'Submit application',
                      ].map((t) => (
                        <label className="check-label" key={t}>
                          <Checkbox
                            disabled={busy}
                            checked={a.tasks.includes(t)}
                            onCheckedChange={(v) =>
                              void persist({
                                ...state,
                                applications: state.applications.map((x) =>
                                  x.id === a.id
                                    ? {
                                        ...x,
                                        tasks: v
                                          ? [...x.tasks, t]
                                          : x.tasks.filter((y) => y !== t),
                                      }
                                    : x,
                                ),
                              })
                            }
                          />
                          {t}
                        </label>
                      ))}
                      <p className="tiny">
                        Deadline: confirm with institution. Tasks are planning
                        suggestions.
                      </p>
                    </section>
                  ))}
                </>
              ) : (
                <section className="card">
                  <h2>
                    {page === 'visa'
                      ? `${Math.round((state.checks.length / 7) * 100)}% of your general checklist complete`
                      : 'Your next 30 days'}
                  </h2>
                  {page === 'visa' && (
                    <Progress value={(state.checks.length / 7) * 100} />
                  )}
                  <p>
                    {page === 'visa'
                      ? 'Adapt this general checklist to the visa type and local consulate.'
                      : 'Suggested sequence, not official deadlines. Confirm intake dates before scheduling submissions.'}
                  </p>
                  {[
                    'Passport ready',
                    'Academic documents ready',
                    'Language evidence ready',
                    'Offer letter received',
                    'Financial evidence prepared',
                    'Required forms reviewed',
                    'Destination checklist confirmed',
                  ].map((t, i) => (
                    <label className="check-label roadmap-item" key={t}>
                      <Checkbox
                        disabled={busy || !ready}
                        checked={state.checks.includes(t)}
                        onCheckedChange={(v) =>
                          void persist({
                            ...state,
                            checks: v
                              ? [...state.checks, t]
                              : state.checks.filter((x) => x !== t),
                          })
                        }
                      />
                      <span>
                        <strong>{t}</strong>
                        <small>
                          {page === 'roadmap'
                            ? i < 3
                              ? 'Start now'
                              : i < 5
                                ? 'After shortlisting'
                                : 'After confirming the pathway'
                            : 'Self-reported preparation'}
                        </small>
                      </span>
                    </label>
                  ))}
                  {sourceLink('uk-money')}
                  <p>
                    Verified country-specific visa checklists for Korea and
                    Germany are not yet stored. Confirm with the official
                    authority.
                  </p>
                </section>
              )}
            </>
          )}
          {page === 'consultant' && (
            <>
              <Heading
                title="A little clarity goes a long way."
                text="Your consultant has your saved profile, shortlist and application context."
              />
              <section className="card chat">
                <div className="chat-intro">
                  <Compass />
                  <h2>Let&apos;s think about your next chapter.</h2>
                  <p>
                    I can help you compare your options and understand the
                    evidence.
                  </p>
                </div>
                {state.messages.map((m, i) => (
                  <div className={'message ' + m.role} key={i}>
                    <small>{m.role === 'user' ? p.name : 'ConsultAI'}</small>
                    <p>{m.text}</p>
                  </div>
                ))}
                {busy && (
                  <p aria-live="polite">
                    Retrieving evidence and checking your profile…
                  </p>
                )}
                <div className="suggestions">
                  {[
                    'Where should I study?',
                    'What about Korea?',
                    'Which country is cheapest?',
                    'Can I get a scholarship?',
                  ].map((t) => (
                    <button key={t} onClick={() => setDraft(t)}>
                      {t}
                    </button>
                  ))}
                </div>
                <form
                  className="chat-input"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void chat();
                  }}
                >
                  <Input
                    disabled={!ready || busy}
                    aria-label="Message your consultant"
                    placeholder="Ask about your study plans…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={4000}
                  />
                  <Button
                    type="submit"
                    disabled={busy || !ready || !draft.trim()}
                    aria-label="Send message"
                  >
                    <Send size={19} />
                  </Button>
                </form>
                <p className="tiny">
                  {busy ? 'Preparing your response…' : consultantStatus}
                </p>
              </section>
            </>
          )}
          {page === 'report' && (
            <>
              <Heading
                title="Your next chapter, on paper."
                text="A portable strategy based on your profile, matching results and evidence."
              />
              <div className="actions">
                <button
                  className="button primary"
                  onClick={() => window.print()}
                >
                  <Printer size={17} /> Print / Save as PDF
                </button>
                <button
                  className="button light"
                  disabled={!ready || busy}
                  onClick={() =>
                    void persist({
                      ...state,
                      reports: [
                        ...state.reports,
                        {
                          id: crypto.randomUUID(),
                          createdAt: new Date().toISOString(),
                          profile: p,
                        },
                      ],
                    })
                  }
                >
                  Save strategy snapshot
                </button>
              </div>
              <article className="card report">
                <span className="eyebrow">
                  CONSULTAI / PERSONAL STUDY STRATEGY
                </span>
                <h1>{p.name}&apos;s global study plan</h1>
                <p>Rule-based personalized planning report</p>
                <h2>Executive summary</h2>
                <p>
                  {top.country} leads this curated comparison at {top.score}/100
                  planning fit. Explore the pathway while resolving funding and
                  admission uncertainty. This is not an admission or visa
                  guarantee.
                </p>
                <h2>Your profile</h2>
                <p>
                  {p.citizenship} · {p.qualification} · {p.marks}% · IELTS{' '}
                  {p.ielts} · {p.degree} in {p.field} · Available funds{' '}
                  {money(p.budget)}.
                </p>
                <h2>Country rankings & university shortlist</h2>
                {result.universities.map((u, i) => (
                  <section key={u.id}>
                    <h3>
                      {i + 1}. {u.country} — {u.name} · {u.score}/100
                    </h3>
                    <p>
                      {u.status}. {u.caveat}
                    </p>
                    <p>
                      Financial plan: tuition {money(u.tuition)}, living{' '}
                      {money(u.living)}, total {money(u.total)} for one year.
                      Scenario estimates, with no scholarship deducted.
                    </p>
                    <p>Risks: {[...u.issues, ...u.unknown].join(' ')}</p>
                  </section>
                ))}
                <h2>Scholarships</h2>
                <p>
                  Investigate KAIST funding and the current GKS call. Neither
                  award is assumed.
                </p>
                <h2>Application timeline & next 30 days</h2>
                <p>
                  Verify qualifications and language requirements; shortlist
                  programs, collect academic records, prepare an authentic SOP
                  and request references. Confirm official intake deadlines
                  before scheduling submission.
                </p>
                <h2>Documents & visa preparation</h2>
                <p>
                  Prepare passport, academic and language evidence, offer
                  documents, financial evidence and the destination&apos;s
                  official forms. Your general checklist is{' '}
                  {Math.round((state.checks.length / 7) * 100)}% complete.
                </p>
                <h2>Recommended strategy</h2>
                <p>
                  Resolve every mandatory gate, confirm full costs and avoid
                  depending on an unawarded scholarship. Add IELTS components
                  and verify qualification equivalence before paying fees.
                </p>
                <h2>Sources</h2>
                {sources.map((s) => (
                  <p key={s.id}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.organization}: {s.title}
                    </a>{' '}
                    — {s.status}, {s.verifiedAt || 'not reviewed'}
                  </p>
                ))}
                <h2>Saved snapshots</h2>
                <button
                  className="button light"
                  onClick={() => setReportId(null)}
                >
                  View current profile strategy
                </button>
                {state.reports.length ? (
                  state.reports.map((r) => (
                    <p key={r.id}>
                      <button
                        className="source-link"
                        onClick={() => setReportId(r.id)}
                      >
                        View this profile snapshot
                      </button>
                      {new Date(r.createdAt).toLocaleString()} ·{' '}
                      {r.profile.name} · IELTS {r.profile.ielts} ·{' '}
                      {money(r.profile.budget)}
                    </p>
                  ))
                ) : (
                  <p>No snapshots saved yet.</p>
                )}
              </article>
            </>
          )}
          {page === 'documents' && <DocumentCoach setNotice={setNotice} />}
          {page === 'admin' && <Admin sourcesOpen={setSource} />}
          {page === 'pitch' && (
            <>
              <Heading
                title="Clearer decisions. Bigger futures."
                text="ConsultAI · Your verified AI consultant for studying abroad."
              />
              <div className="dashboard-columns">
                {[
                  [
                    'The problem',
                    'Students piece together advice from consultants, universities and immigration websites. Costs, eligibility and source quality are difficult to compare.',
                  ],
                  [
                    'The solution',
                    'A remembered student profile, deterministic fit scores, explicit eligibility gates and inspectable official evidence.',
                  ],
                  [
                    'AI architecture',
                    'Profile context + filtered evidence retrieval + provider abstraction + citation validation. Scores always come from code.',
                  ],
                  [
                    'Commercial model',
                    'Free discovery, paid guidance and document coaching; future consultant seats and white-label licensing. Payments are not enabled.',
                  ],
                  [
                    'Trust by design',
                    'Facts retain provenance. Estimates remain labeled. Changes require review. Missing evidence stays visible.',
                  ],
                  [
                    'What comes next',
                    'Expand verified coverage, evaluate retrieval with students, add counselor review and a PostgreSQL vector index.',
                  ],
                ].map(([t, d]) => (
                  <section className="card" key={t}>
                    <h2>{t}</h2>
                    <p>{d}</p>
                  </section>
                ))}
              </div>
            </>
          )}
        </main>
        <footer className="app-footer">
          <ShieldCheck size={15} /> Built around evidence. Designed around you.
          <span>Fit is not a guarantee of admission.</span>
        </footer>
      </SidebarInset>
      <Sheet open={!!source} onOpenChange={(v) => !v && setSource(null)}>
        <SheetContent className="source-drawer">
          <SheetHeader>
            <span className="eyebrow">FOLLOW THE EVIDENCE</span>
            <SheetTitle>{source?.title}</SheetTitle>
            <SheetDescription>{source?.organization}</SheetDescription>
          </SheetHeader>
          {source && (
            <div className="source-body">
              <span
                className={
                  'badge ' +
                  (source.status === 'VERIFIED' ? 'success' : 'warning')
                }
              >
                {source.status === 'VERIFIED' ? (
                  <ShieldCheck size={15} />
                ) : (
                  <TriangleAlert size={15} />
                )}{' '}
                {source.status.replace('_', ' ')}
              </span>
              <dl>
                <dt>Authority</dt>
                <dd>{source.authority}</dd>
                <dt>Reviewed</dt>
                <dd>{source.verifiedAt || 'Not verified'}</dd>
                <dt>Review due</dt>
                <dd>
                  {source.reviewDueAt}
                  {new Date(source.reviewDueAt) < new Date() && (
                    <span className="badge warning">Review overdue</span>
                  )}
                </dd>
                <dt>Scope</dt>
                <dd>
                  {source.country} / {source.topic}
                </dd>
              </dl>
              <h3>Relevant information</h3>
              <p>{source.text}</p>
              <p className="tiny">
                Review applies to this summary. Later intake details are not
                automatically verified.
              </p>
              <a
                className="button primary"
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                Open official source <ExternalLink size={16} />
              </a>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
}
export function Heading({ title, text }: { title: string; text: string }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">YOUR STUDY ABROAD WORKSPACE</p>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <section className="card empty">
      <Compass />
      <h2>A clear next step.</h2>
      <p>{text}</p>
      <Link href="/universities" className="button primary">
        Explore universities <ArrowRight size={16} />
      </Link>
    </section>
  );
}
