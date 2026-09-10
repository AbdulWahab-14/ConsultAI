import Link from 'next/link';
import {
  getChatGPTUser,
  chatGPTSignInPath,
  chatGPTSignOutPath,
} from '@/app/chatgpt-auth';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Your account — ConsultAI',
  robots: { index: false, follow: false },
};
export default async function Account() {
  const user = await getChatGPTUser();
  return (
    <main className="account-page card">
      <p className="eyebrow">CONSULTAI / YOUR ACCOUNT</p>
      <h1>{user ? 'Your study workspace.' : 'Keep your plans together.'}</h1>
      {user ? (
        <>
          <p>Signed in as {user.displayName}.</p>
          <p>
            Your profile, shortlist, conversations and application progress are
            saved to your account.
          </p>
          <Link className="button primary" href="/dashboard">
            Open workspace
          </Link>
          <a className="button light" href={chatGPTSignOutPath()} target="_top">
            Sign out
          </a>
        </>
      ) : (
        <>
          <p>
            Sign in with ChatGPT to access your persistent personal workspace.
            Authentication and account recovery are handled by ChatGPT.
          </p>
          <a
            className="button primary"
            href={chatGPTSignInPath('/dashboard')}
            target="_top"
          >
            Sign in / create an account
          </a>
          <Link className="button light" href="/demo">
            Try a private demo
          </Link>
        </>
      )}
      <p className="tiny">
        Demo workspaces use a private browser cookie and are separate from
        signed-in accounts.
      </p>
    </main>
  );
}
