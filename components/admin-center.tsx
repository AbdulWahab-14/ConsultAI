'use client';
import type { Scholarship, VisaInfo } from '@/lib/demo-knowledge';
import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Database,
  Clock,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  sources as seedSources,
  type Source,
  type Program,
} from '@/lib/catalog';
import { defaultWeights } from '@/lib/matching';
type Review = {
  id: string;
  url: string;
  status: string;
  created_at: string;
  text: string;
};
type AdminData = {
  sources: Source[];
  programs: Program[];
  scholarships: Scholarship[];
  visas: VisaInfo[];
  index: { embedding_profile: string; chunks: number; indexedAt: string }[];
  weights: typeof defaultWeights;
  reviews: Review[];
  health: {
    country: string;
    score: number;
    reviewed: number;
    total: number;
    fresh: number;
    completePrograms: number;
  }[];
  users: { count: number };
};
export default function AdminCenter({
  sourcesOpen,
}: {
  sourcesOpen: (s: Source) => void;
}) {
  const [data, setData] = useState<AdminData | null>(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [url, setUrl] = useState(''),
    [busy, setBusy] = useState(false),
    [weights, setWeights] = useState(defaultWeights),
    [selected, setSelected] = useState<Review | null>(null),
    [summary, setSummary] = useState(''),
    [editor, setEditor] = useState<
      'sources' | 'programs' | 'scholarships' | 'visas' | null
    >(null),
    [jsonText, setJsonText] = useState('');
  async function refresh() {
    try {
      const r = await fetch('/api/admin/catalog');
      const d = (await r.json()) as AdminData & { error?: string };
      if (!r.ok) throw Error(d.error);
      setData(d);
      setWeights(d.weights);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to load knowledge center.',
      );
    }
  }
  useEffect(() => {
    fetch('/api/admin/catalog')
      .then(async (r) => {
        const d = (await r.json()) as AdminData & { error?: string };
        if (!r.ok) throw Error(d.error);
        return d;
      })
      .then((d) => {
        setData(d);
        setWeights(d.weights);
      })
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : 'Unable to load knowledge center.',
        ),
      );
  }, []);
  async function request(
    path: string,
    body: unknown,
    method: 'POST' | 'PUT' = 'POST',
  ) {
    setBusy(true);
    setNotice('');
    try {
      const r = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = (await r.json()) as { message?: string; error?: string };
      if (!r.ok) throw Error(d.error || 'Request failed');
      setNotice(d.message || 'Changes saved and recorded in the audit log.');
      await refresh();
      return true;
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Please retry.');
      return false;
    } finally {
      setBusy(false);
    }
  }
  const inspect = (r: Review) => {
    setSelected(r);
    const current = data?.sources.find((s) => s.url === r.url);
    setSummary(
      JSON.stringify(
        current || {
          id: r.id,
          title: '',
          organization: new URL(r.url).hostname,
          url: r.url,
          country: 'South Korea',
          topic: 'admission',
          authority: 'Official university',
          text: '',
          verifiedAt: null,
          reviewDueAt: new Date(
            new Date(r.created_at).getTime() + 30 * 86400000,
          )
            .toISOString()
            .slice(0, 10),
          status: 'NEEDS_REVIEW',
        },
        null,
        2,
      ),
    );
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CONSULTAI / KNOWLEDGE OPERATIONS</p>
          <h1>Knowledge intelligence center.</h1>
          <p>
            Know what is verified, what changed, and what needs a closer look.
          </p>
        </div>
      </div>
      {notice && <output className="notice">{notice}</output>}
      {error ? (
        <section className="card">
          <ShieldCheck className="green" />
          <h2>Administrator access required</h2>
          <p>{error}</p>
          <a
            className="button primary"
            href="/signin-with-chatgpt?return_to=%2Fadmin"
            target="_top"
          >
            Sign in
          </a>
          <h3>Read-only source catalog</h3>
          <p>Review permissions never come from a client-side role switch.</p>
          {seedSources.map((s) => (
            <button
              key={s.id}
              className="source-link"
              onClick={() => sourcesOpen(s)}
            >
              {s.title}
            </button>
          ))}
        </section>
      ) : !data ? (
        <p>Checking administrator access…</p>
      ) : (
        <>
          <div className="metrics">
            {[
              {
                label: 'Student workspaces',
                value: data.users.count,
                Icon: Database,
              },
              {
                label: 'Source summaries',
                value: data.sources.length,
                Icon: ShieldCheck,
              },
              {
                label: 'Review queue',
                value: data.reviews.filter(
                  (r) => r.status !== 'VERIFIED' && r.status !== 'REJECT',
                ).length,
                Icon: Clock,
              },
              {
                label: 'Programs',
                value: data.programs.length,
                Icon: FileCheck,
              },
            ].map(({ label, value, Icon }) => (
              <section className="card metric" key={label}>
                <div className="row between">
                  {label}
                  <Icon size={19} />
                </div>
                <strong>{value}</strong>
              </section>
            ))}
          </div>
          <div className="university-grid">
            {data.health.map((h) => (
              <section className="card" key={h.country}>
                <h2>{h.country}</h2>
                <h3 className="detail-score">
                  {h.score}
                  <small>/100 knowledge health</small>
                </h3>
                <Progress value={h.score} />
                <p>
                  {h.reviewed}/{h.total} reviewed · {h.fresh} fresh summaries
                </p>
                <p className="tiny">
                  35% reviewed coverage + 35% freshness + 30% program-field
                  completeness. {h.completePrograms} fully populated, non-demo
                  programs.
                </p>
              </section>
            ))}
          </div>
          <div className="dashboard-columns">
            <section className="card">
              <h2>Bring in official evidence</h2>
              <p>
                Fetch an approved official domain. Changed content enters
                review; it does not overwrite published guidance.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void request('/api/admin/sources', { url });
                }}
              >
                <label className="field" htmlFor="source-url">
                  Official URL
                  <Input
                    id="source-url"
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </label>
                <Button type="submit" className="mt-4" disabled={busy}>
                  Refresh official source
                </Button>
              </form>
            </section>
            <form
              className="card"
              onSubmit={(e) => {
                e.preventDefault();
                void request(
                  '/api/admin/catalog',
                  { key: 'weights', value: weights },
                  'PUT',
                );
              }}
            >
              <h2>Explainable matching weights</h2>
              <div className="form-grid">
                {Object.entries(weights).map(([k, v]) => (
                  <label className="field" htmlFor={'weight-' + k} key={k}>
                    {k}
                    <Input
                      id={'weight-' + k}
                      type="number"
                      min={0}
                      max={100}
                      value={v}
                      onChange={(e) =>
                        setWeights({ ...weights, [k]: Number(e.target.value) })
                      }
                    />
                  </label>
                ))}
              </div>
              <p className="tiny">
                Total: {Object.values(weights).reduce((a, b) => a + b, 0)}/100.
                Mandatory gates always apply independently.
              </p>
              <Button
                type="submit"
                disabled={
                  busy ||
                  Object.values(weights).reduce((a, b) => a + b, 0) !== 100
                }
              >
                Save weights
              </Button>
            </form>
          </div>
          <section className="card">
            <h2>Published official sources</h2>
            {data.sources.map((source) => (
              <div className="country-row" key={source.id}>
                <div>
                  <strong>{source.title}</strong>
                  <small>
                    {source.status} - verified {source.verifiedAt || 'not yet'}{' '}
                    - review due {source.reviewDueAt}
                  </small>
                  <small style={{ overflowWrap: 'anywhere' }}>
                    Summary SHA-256: {source.contentHash || 'not indexed'}
                  </small>
                </div>
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() =>
                    void request('/api/admin/sources', { url: source.url })
                  }
                >
                  Refresh official source
                </Button>
              </div>
            ))}
            <h2>Evidence index</h2>
            {data.index.map((i) => (
              <p key={i.embedding_profile}>
                {i.chunks} chunks - {i.embedding_profile} - {i.indexedAt}
              </p>
            ))}
            <Button
              disabled={busy}
              onClick={() => void request('/api/admin/index', {})}
            >
              Reindex reviewed evidence
            </Button>
            <h2>Source review queue</h2>
            {!data.reviews.length ? (
              <p>No sources fetched yet.</p>
            ) : (
              data.reviews.map((r) => (
                <div className="country-row" key={r.id}>
                  <div>
                    <strong>{new URL(r.url).hostname}</strong>
                    <small>
                      {r.status} · {new Date(r.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <Button variant="outline" onClick={() => inspect(r)}>
                    Review captured text
                  </Button>
                </div>
              ))
            )}
          </section>
          {selected && (
            <section className="card mt-6">
              <div className="section-title">
                <h2>Review source change</h2>
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer"
                  className="source-link"
                >
                  Official page <ExternalLink size={15} />
                </a>
              </div>
              <p>
                Read the captured evidence, compare the current summary, and
                edit the proposed structured record before approving.
              </p>
              <div className="dashboard-columns">
                <div>
                  <h3>Captured source text</h3>
                  <pre className="source-excerpt">{selected.text}</pre>
                  <h3>Current published summary</h3>
                  <p>
                    {data.sources.find((s) => s.url === selected.url)?.text ||
                      'No published summary for this URL.'}
                  </p>
                </div>
                <label className="field" htmlFor="review-json">
                  Proposed source record
                  <textarea
                    id="review-json"
                    rows={22}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </label>
              </div>
              <div className="actions">
                <Button
                  disabled={busy}
                  onClick={() => {
                    try {
                      void request('/api/admin/review', {
                        id: selected.id,
                        action: 'APPROVE',
                        source: JSON.parse(summary),
                      });
                    } catch {
                      setNotice('The proposed record must be valid JSON.');
                    }
                  }}
                >
                  Approve verified summary
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void request('/api/admin/review', {
                      id: selected.id,
                      action: 'NEEDS_REVIEW',
                    })
                  }
                >
                  Needs review
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void request('/api/admin/review', {
                      id: selected.id,
                      action: 'REJECT',
                    })
                  }
                >
                  Reject
                </Button>
              </div>
            </section>
          )}
          <section className="card mt-6">
            <h2>Curated catalog management</h2>
            <p>
              Program costs remain explicit scenarios unless you have
              independently verified the relevant fees. Every important program
              fact should link to a reviewed source. Programs contain the
              university name and location. Add or update records in the editors
              below; publishing is an explicit administrator review. Refreshing
              a page never changes these facts automatically.
            </p>
            <div className="actions">
              {(['sources', 'programs', 'scholarships', 'visas'] as const).map(
                (key) => (
                  <Button
                    variant="outline"
                    key={key}
                    onClick={() => {
                      setEditor(key);
                      setJsonText(JSON.stringify(data[key], null, 2));
                    }}
                  >
                    Edit {key}
                  </Button>
                ),
              )}
            </div>
            {editor && (
              <>
                <label className="field" htmlFor="catalog-editor">
                  {editor} records
                  <textarea
                    id="catalog-editor"
                    rows={20}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                  />
                </label>
                <Button
                  disabled={busy}
                  onClick={() => {
                    try {
                      void request(
                        '/api/admin/catalog',
                        { key: editor, value: JSON.parse(jsonText) },
                        'PUT',
                      );
                    } catch {
                      setNotice('Enter valid JSON before saving.');
                    }
                  }}
                >
                  Review and publish catalog
                </Button>
              </>
            )}
          </section>
        </>
      )}
    </>
  );
}
