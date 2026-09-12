import { additionalSources, additionalPrograms } from './demo-knowledge';
export type Source = {
  id: string;
  title: string;
  organization: string;
  url: string;
  country: string;
  topic: string;
  authority: string;
  text: string;
  verifiedAt: string | null;
  reviewDueAt: string;
  status: 'VERIFIED' | 'NEEDS_REVIEW';
  contentHash?: string;
  captureHash?: string | null;
};
export const sources: Source[] = [
  {
    id: 'uk-money',
    title: 'Student visa: money you need',
    organization: 'UK Government',
    url: 'https://www.gov.uk/student-visa/money',
    country: 'United Kingdom',
    topic: 'visa',
    authority: 'Official government',
    text: 'Financial evidence normally covers first-year course fees plus living funds of £1,529 per month in London or £1,171 outside London, for up to nine months. Funds normally must be held for 28 consecutive days, ending within 31 days before application. Exceptions depend on circumstances.',
    verifiedAt: '2026-09-09',
    reviewDueAt: '2026-10-09',
    status: 'VERIFIED',
  },
  {
    id: 'daad-pk',
    title: 'Getting started: Pakistani qualifications',
    organization: 'DAAD Pakistan',
    url: 'https://www.daad.pk/en/study-research-in-germany/eight-steps-to-germany/getting-started/',
    country: 'Germany',
    topic: 'admission',
    authority: 'Official education organization',
    text: 'DAAD advises HSSC holders to complete one year of undergraduate study in Pakistan before applying for undergraduate study in the same field in Germany. Confirm the applicable route and qualification recognition with the institution.',
    verifiedAt: '2026-09-09',
    reviewDueAt: '2026-12-09',
    status: 'VERIFIED',
  },
  {
    id: 'kaist-funding',
    title: 'KAIST Scholarship',
    organization: 'KAIST Admissions',
    url: 'https://admission.kaist.ac.kr/intl-undergraduate/support/scholarships/kaist/',
    country: 'South Korea',
    topic: 'scholarship',
    authority: 'Official university',
    text: 'The KAIST Scholarship for admitted international students includes eight semesters of tuition exemption, KRW 350,000 monthly living support and health insurance. Select the scholarship on the admission application. Continuation requires a GPA above 2.7/4.3 after freshman year. Admission is not guaranteed.',
    verifiedAt: '2026-09-09',
    reviewDueAt: '2026-10-09',
    status: 'VERIFIED',
  },
  {
    id: 'gks',
    title: 'Global Korea Scholarship overview',
    organization: 'Study in Korea / NIIED',
    url: 'https://studyinkorea.go.kr/ko/plan/scholarship.do?tab=gks-tab1',
    country: 'South Korea',
    topic: 'scholarship',
    authority: 'Official government',
    text: 'The Korean government operates the Global Korea Scholarship for international study. Eligible countries, institutions, selection criteria and deadlines must be checked in the current intake guidelines. This overview alone does not establish individual eligibility.',
    verifiedAt: '2026-09-09',
    reviewDueAt: '2026-10-09',
    status: 'VERIFIED',
  },
  {
    id: 'sheffield-cs',
    title: 'Computer Science BSc, 2026 entry',
    organization: 'University of Sheffield',
    url: 'https://sheffield.ac.uk/undergraduate/courses/2026/computer-science-bsc',
    country: 'United Kingdom',
    topic: 'program',
    authority: 'Official university',
    text: 'Sheffield offers a three-year Computer Science BSc (G402), starting in September. Published English requirement: IELTS 6.5 overall with at least 6.0 in each component. Pakistani qualification equivalence and future-intake fees require separate confirmation.',
    verifiedAt: '2026-09-09',
    reviewDueAt: '2026-10-09',
    status: 'VERIFIED',
  },
  {
    id: 'hbrs-cs',
    title: 'Computer Science BSc',
    organization: 'Hochschule Bonn-Rhein-Sieg',
    url: 'https://www.h-brs.de/en/inf/study/bachelor/computer-science',
    country: 'Germany',
    topic: 'program',
    authority: 'Official university',
    text: 'Hochschule Bonn-Rhein-Sieg offers a Computer Science BSc. This is not verified as an English-only bachelor pathway. Check German-language evidence and university entrance recognition before applying.',
    verifiedAt: '2026-09-09',
    reviewDueAt: '2026-12-09',
    status: 'VERIFIED',
  },
  {
    id: 'kaist-guide',
    title: 'International undergraduate application guide',
    organization: 'KAIST Admissions',
    url: 'https://admission.kaist.ac.kr/intl-undergraduate/application/ApplicationGuide/guide',
    country: 'South Korea',
    topic: 'admission',
    authority: 'Official university',
    text: 'Current admission cycle, English test policy, available majors and deadlines need review. Older guidance recommends IELTS 6.5; this is not treated as a verified current mandatory cutoff.',
    verifiedAt: null,
    reviewDueAt: '2026-09-09',
    status: 'NEEDS_REVIEW',
  },
];
sources.push(...additionalSources);
export type Program = {
  id: string;
  name: string;
  short: string;
  country: string;
  city: string;
  field: string;
  degree: string;
  tuition: number;
  living: number;
  ielts: number | null;
  academic: number | null;
  scholarship: boolean;
  sourceIds: string[];
  caveat: string;
  isDemoData: boolean;
  language: string;
  category: string;
  ieltsComponentMin?: number | null;
  academicRequirement?: string | null;
  officialTuitionAmount?: number | null;
  tuitionCurrency?: string | null;
  tuitionIntake?: string | null;
  deadline?: string | null;
};
// PKR figures are explicit scenario estimates, not institution quotations or live exchange conversions.
export const programs: Program[] = [
  {
    id: 'kaist',
    name: 'KAIST',
    short: 'KA',
    country: 'South Korea',
    city: 'Daejeon',
    field: 'Computer Science',
    degree: 'Bachelor',
    tuition: 1800000,
    living: 1500000,
    ielts: null,
    academic: null,
    scholarship: true,
    sourceIds: ['kaist-guide', 'kaist-funding'],
    caveat:
      'Highly selective. Confirm current program and English policy. Scholarship funding is conditional on admission.',
    isDemoData: true,
    language: 'Confirm current teaching language',
    category: 'Dream',
  },
  {
    id: 'hbrs',
    name: 'Hochschule Bonn-Rhein-Sieg',
    short: 'HB',
    country: 'Germany',
    city: 'Sankt Augustin',
    field: 'Computer Science',
    degree: 'Bachelor',
    tuition: 200000,
    living: 3900000,
    ielts: null,
    academic: null,
    scholarship: false,
    sourceIds: ['hbrs-cs', 'daad-pk'],
    caveat:
      'German-language evidence and HSSC recognition pathway require confirmation.',
    isDemoData: true,
    language: 'German',
    category: 'Pathway to investigate',
  },
  {
    id: 'sheffield',
    ieltsComponentMin: 6,
    name: 'University of Sheffield',
    short: 'SH',
    country: 'United Kingdom',
    city: 'Sheffield',
    field: 'Computer Science',
    degree: 'Bachelor',
    tuition: 10500000,
    living: 4200000,
    ielts: 6.5,
    academic: null,
    scholarship: false,
    sourceIds: ['sheffield-cs', 'uk-money'],
    caveat:
      'IELTS components must each be at least 6.0. FSc equivalence and the next intake need confirmation.',
    isDemoData: true,
    language: 'English',
    category: 'Dream',
  },
];
programs.push(...additionalPrograms);
export const countries = ['South Korea', 'Germany', 'United Kingdom'];
export const flags: Record<string, string> = {
  'South Korea': '🇰🇷',
  Germany: '🇩🇪',
  'United Kingdom': '🇬🇧',
};
export const money = (n: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(n);
