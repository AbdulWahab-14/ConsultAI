import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="card account-page">
      <h1>That path is not here.</h1>
      <p>Return to your study workspace to continue.</p>
      <Link className="button primary" href="/dashboard">
        Open workspace
      </Link>
    </main>
  );
}
