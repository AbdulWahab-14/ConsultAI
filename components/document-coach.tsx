'use client';
import { useState, useEffect } from 'react';
import { FileText, Trash2, Download, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
type Doc = { id: string; review: string; created_at: string };
export default function DocumentCoach({
  setNotice,
}: {
  setNotice: (s: string) => void;
}) {
  const [text, setText] = useState(''),
    [result, setResult] = useState(''),
    [busy, setBusy] = useState(false),
    [documents, setDocuments] = useState<Doc[]>([]);
  const refresh = async () => {
    const r = await fetch('/api/documents');
    if (r.ok) setDocuments((await r.json()) as Doc[]);
  };
  useEffect(() => {
    fetch('/api/documents')
      .then(async (r) => (r.ok ? ((await r.json()) as Doc[]) : []))
      .then(setDocuments)
      .catch(() => setNotice('Could not load saved document reviews.'));
  }, [setNotice]);
  async function review() {
    setBusy(true);
    try {
      const r = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const d = (await r.json()) as { error?: string; review: string };
      if (!r.ok) throw Error(d.error);
      setResult(d.review);
      setNotice('Private document and review saved.');
      await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Review unavailable.');
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    try {
      const r = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!r.ok) throw Error('Could not delete this document.');
      setResult('');
      setNotice('Document and review deleted.');
      await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">AUTHENTIC STORIES, THOUGHTFULLY TOLD</p>
          <h1>Your story. Stronger.</h1>
          <p>
            Turn real experience into a clear, specific statement of purpose.
          </p>
        </div>
      </div>
      <section className="card profile-form">
        <div className="row">
          <ShieldCheck className="green" />
          <p className="mb-0">Private document review</p>
        </div>
        <p className="mt-4">
          Paste your text or upload a UTF-8 .txt document (up to 100 KB). PDF
          and Word extraction are not yet supported.
        </p>
        <Input
          type="file"
          accept=".txt,text/plain"
          aria-label="Upload text document"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 100000 || !f.name.toLowerCase().endsWith('.txt')) {
              setNotice('Use a .txt document smaller than 100 KB.');
              return;
            }
            setText(await f.text());
          }}
        />
        <label className="field mt-5" htmlFor="document-text">
          Document text
          <textarea
            id="document-text"
            maxLength={20000}
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <Button
          className="mt-4"
          disabled={busy || text.trim().length < 50}
          onClick={() => void review()}
        >
          {busy ? 'Reviewing…' : 'Review my document'}
        </Button>
        <p className="tiny mt-4">
          AI review uses exact quoted evidence when configured. Otherwise the
          app clearly labels its basic writing checks. Neither is an admission
          assessment.
        </p>
        {result && <div className="document-result">{result}</div>}
      </section>
      <section className="card mt-6">
        <h2>Your saved document reviews</h2>
        {!documents.length ? (
          <p>No document reviews saved yet.</p>
        ) : (
          documents.map((d) => (
            <div className="country-row" key={d.id}>
              <FileText size={20} />
              <div>
                <strong>Document review</strong>
                <small>{new Date(d.created_at).toLocaleString()}</small>
              </div>
              <Button variant="outline" onClick={() => setResult(d.review)}>
                Read review
              </Button>
              <a
                className="icon-button"
                href={'/api/documents/' + d.id}
                aria-label="Download private document"
              >
                <Download size={18} />
              </a>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete document"
                    />
                  }
                >
                  <Trash2 size={17} />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete this private document?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      The uploaded text and its review will be permanently
                      removed from your workspace.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep document</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={busy}
                      onClick={() => void remove(d.id)}
                    >
                      Delete document
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))
        )}
      </section>
    </>
  );
}
