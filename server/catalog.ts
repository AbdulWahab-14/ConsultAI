import { z } from 'zod';
import { type Source, type Program } from '@/lib/catalog';
import { defaultWeights } from '@/lib/matching';
import { runtime } from './runtime';
import { type Scholarship, type VisaInfo } from '@/lib/demo-knowledge';
import { contentHash } from '@/lib/knowledge';
export const weightsSchema = z
  .object({
    academics: z.number().min(0).max(100),
    budget: z.number().min(0).max(100),
    language: z.number().min(0).max(100),
    program: z.number().min(0).max(100),
    scholarship: z.number().min(0).max(100),
    preference: z.number().min(0).max(100),
  })
  .refine(
    (w) => Object.values(w).reduce((a, b) => a + b, 0) === 100,
    'Weights must total 100.',
  );
export const sourceSchema = z.object({
  contentHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  captureHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .nullable()
    .optional(),
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  organization: z.string().min(1).max(200),
  url: z.url().refine((v) => {
    const u = new URL(v);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port;
  }),
  country: z.enum(['South Korea', 'Germany', 'United Kingdom']),
  topic: z.string().min(1).max(80),
  authority: z.string().min(1).max(100),
  text: z.string().min(20).max(10000),
  verifiedAt: z.iso.date().nullable(),
  reviewDueAt: z.iso.date(),
  status: z.enum(['VERIFIED', 'NEEDS_REVIEW']),
});
export const programSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(100),
  name: z.string().min(1).max(200),
  short: z.string().min(1).max(5),
  country: z.enum(['South Korea', 'Germany', 'United Kingdom']),
  city: z.string().min(1).max(100),
  field: z.string().min(1).max(100),
  degree: z.enum(['Bachelor', 'Master', 'PhD']),
  tuition: z.number().min(0).max(1e9),
  living: z.number().min(0).max(1e9),
  ielts: z.number().min(0).max(9).nullable(),
  academic: z.number().min(0).max(100).nullable(),
  scholarship: z.boolean(),
  sourceIds: z.array(z.string()).min(1).max(20),
  caveat: z.string().max(3000),
  isDemoData: z.boolean(),
  language: z.string().max(100),
  category: z.string().max(100),
  ieltsComponentMin: z.number().min(0).max(9).nullable().optional(),
  academicRequirement: z.string().max(2000).nullable().optional(),
  officialTuitionAmount: z.number().min(0).max(1e9).nullable().optional(),
  tuitionCurrency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .nullable()
    .optional(),
  tuitionIntake: z.string().max(500).nullable().optional(),
  deadline: z.string().max(500).nullable().optional(),
});
export async function getCatalog() {
  const rows = await runtime()
    .DB.prepare('SELECT key,value FROM settings')
    .all<{ key: string; value: string }>();
  const values = Object.fromEntries(
    rows.results.map((r) => [r.key, JSON.parse(r.value)]),
  );
  const stored = await runtime()
    .DB.prepare('SELECT kind,payload FROM catalog_records ORDER BY rowid')
    .all<{ kind: string; payload: string }>();
  const records = (kind: string) =>
    stored.results
      .filter((r) => r.kind === kind)
      .map((r) => JSON.parse(r.payload));
  const loadedSources = records('sources') as Source[];
  return {
    sources: await Promise.all(
      loadedSources.map(async (s) => ({
        ...s,
        contentHash: await contentHash(s.text),
      })),
    ),
    programs: records('programs') as Program[],
    scholarships: records('scholarships') as Scholarship[],
    visas: records('visas') as VisaInfo[],
    weights: weightsSchema.parse(values.weights || defaultWeights),
  };
}
export function knowledgeHealth(catalog: {
  sources: Source[];
  programs: Program[];
}) {
  const now = new Date();
  return ['South Korea', 'Germany', 'United Kingdom'].map((country) => {
    const src = catalog.sources.filter((s) => s.country === country),
      uni = catalog.programs.filter((p) => p.country === country);
    const reviewed = src.filter(
        (s) => s.status === 'VERIFIED' && s.verifiedAt,
      ).length,
      fresh = src.filter(
        (s) => s.status === 'VERIFIED' && new Date(s.reviewDueAt) >= now,
      ).length;
    const completeness = uni.length
      ? uni.reduce(
          (n, p) =>
            n +
            [p.academic !== null, p.ielts !== null, !p.isDemoData].filter(
              Boolean,
            ).length,
          0,
        ) /
        (uni.length * 3)
      : 0;
    return {
      country,
      score: Math.round(
        (src.length
          ? (reviewed / src.length) * 0.35 + (fresh / src.length) * 0.35
          : 0) *
          100 +
          completeness * 30,
      ),
      reviewed,
      total: src.length,
      fresh,
      completePrograms: uni.filter(
        (p) => p.academic !== null && p.ielts !== null && !p.isDemoData,
      ).length,
    };
  });
}

const countrySchema = z.enum(['South Korea', 'Germany', 'United Kingdom']);
const ids = z.array(z.string().min(1).max(100)).max(20);
export const scholarshipSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(100),
  title: z.string().min(1).max(200),
  country: countrySchema,
  programIds: ids,
  degrees: z.array(z.enum(['Bachelor', 'Master', 'PhD'])).min(1),
  requirements: z.string().min(20).max(3000),
  benefit: z.string().min(10).max(2000),
  sourceIds: ids.min(1),
  deadline: z.string().max(500).nullable(),
  amount: z.number().min(0).max(1e9).nullable(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .nullable(),
  period: z.string().max(200).nullable(),
  continuationGpa: z.number().min(0).max(10).nullable(),
  gpaScale: z.number().positive().max(10).nullable(),
  minimumCredits: z.number().int().min(0).max(200).nullable(),
});
export const visaSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(100),
  country: countrySchema,
  visaType: z.string().min(1).max(200),
  requirements: z.string().min(20).max(3000),
  sourceIds: ids.min(1),
  fundsAmount: z.number().min(0).max(1e9).nullable(),
  fundsCurrency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .nullable(),
  fundsPeriod: z.string().max(200).nullable(),
  effectiveYear: z.number().int().min(2020).max(2100).nullable(),
});
