export async function contentHash(text: string): Promise<string> {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)),
    ),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
}
export function cosine(a: number[], b: number[]): number {
  if (
    !a.length ||
    a.length !== b.length ||
    !a.every(Number.isFinite) ||
    !b.every(Number.isFinite)
  )
    return -1;
  const norm = Math.sqrt(
    a.reduce((n, v) => n + v * v, 0) * b.reduce((n, v) => n + v * v, 0),
  );
  return norm ? a.reduce((n, v, i) => n + v * b[i], 0) / norm : -1;
}
export function chunks(text: string): string[] {
  // Bounded, overlapping verbatim windows keep citation quotes within the reviewed summary.
  const result: string[] = [];
  for (let i = 0; i < text.length; i += 1200)
    result.push(text.slice(i, i + 1500));
  return result;
}
