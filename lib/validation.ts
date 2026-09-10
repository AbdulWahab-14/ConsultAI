import { z } from 'zod';
export const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  citizenship: z.string().min(1).max(80),
  qualification: z.string().min(1).max(100),
  marks: z.number().min(0).max(100),
  degree: z.enum(['Bachelor', 'Master', 'PhD']),
  field: z.string().min(1).max(100),
  budget: z.number().min(0).max(1e9),
  ielts: z.number().min(0).max(9),
  intake: z.string().max(100),
  preferred: z
    .array(z.enum(['South Korea', 'Germany', 'United Kingdom']))
    .max(3),
  german: z.boolean(),
  priorUniversity: z.boolean(),
  components: z.array(z.number().min(0).max(9)).max(4),
});
export const stateSchema = z.object({
  profile: profileSchema,
  saved: z
    .array(
      z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .max(100),
    )
    .max(200),
  compare: z
    .array(
      z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .max(100),
    )
    .max(4),
  applications: z
    .array(
      z.object({
        id: z.uuid(),
        universityId: z
          .string()
          .regex(/^[a-z0-9-]+$/)
          .max(100),
        status: z.enum([
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
        ]),
        tasks: z.array(z.string().max(100)).max(20),
      }),
    )
    .max(200),
  checks: z
    .array(
      z.enum([
        'Passport ready',
        'Academic documents ready',
        'Language evidence ready',
        'Offer letter received',
        'Financial evidence prepared',
        'Required forms reviewed',
        'Destination checklist confirmed',
      ]),
    )
    .max(7),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string().max(12000),
      }),
    )
    .max(100),
  reports: z
    .array(
      z.object({
        id: z.uuid(),
        createdAt: z.iso.datetime(),
        profile: profileSchema,
      }),
    )
    .max(30),
});
