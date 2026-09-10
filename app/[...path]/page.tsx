import { notFound } from 'next/navigation';
import Workspace from '@/components/workspace';
export const metadata = { robots: { index: false, follow: false } };
export default async function Page({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const allowed = [
    'demo',
    'dashboard',
    'profile',
    'consultant',
    'countries',
    'universities',
    'scholarships',
    'saved',
    'compare',
    'simulator',
    'applications',
    'visa',
    'roadmap',
    'report',
    'documents',
    'admin',
    'pitch',
  ];
  if (
    !allowed.includes(path[0]) ||
    (path.length > 1 && path[0] !== 'universities')
  )
    notFound();
  return <Workspace route={path.join('/')} />;
}
