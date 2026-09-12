import type { Source, Program } from './catalog';

// Reviewed paraphrases of the linked official pages, not scraped full-page copies.
const verified = {
  verifiedAt: '2026-09-12',
  reviewDueAt: '2026-10-12',
  status: 'VERIFIED' as const,
};
export const additionalSources: Source[] = [
  {
    id: 'saarland-cs',
    title: 'Computer Science BSc (English)',
    organization: 'Saarland University',
    url: 'https://www.uni-saarland.de/en/study/programmes/bachelor/computer-science.html',
    country: 'Germany',
    topic: 'program',
    authority: 'Official university',
    text: 'Saarland offers an English-taught Computer Science BSc over six semesters. Tuition fees do not apply; a semester contribution is separate. Admission is restricted and uses different selection tracks. The regular winter application deadline is July 15, with June 15 for the interview track; confirm the applicable intake and track. English proficiency at CEFR B2 or above is recommended.',
    ...verified,
  },
  {
    id: 'southampton-cs',
    title: 'Computer Science BSc',
    organization: 'University of Southampton',
    url: 'https://www.southampton.ac.uk/courses/computer-science-degree-bsc',
    country: 'United Kingdom',
    topic: 'program',
    authority: 'Official university',
    text: 'Southampton offers a three-year Computer Science BSc, UCAS G400, at Highfield. Published A-level entry is A*AA including Mathematics at grade A or above. IELTS is 6.5 overall with 6.0 in each component. The page lists an annual international tuition fee of GBP 33,000; confirm the fee for the selected intake. Pakistani qualification equivalence requires separate review.',
    ...verified,
  },
  {
    id: 'unist-cse',
    title: 'Computer Science and Engineering department',
    organization: 'UNIST',
    url: 'https://cse.unist.ac.kr/cse/index.do',
    country: 'South Korea',
    topic: 'program',
    authority: 'Official university',
    text: 'UNIST has a Computer Science and Engineering department with undergraduate academic information. Applicants must separately confirm the international undergraduate admission route, major selection, teaching language and current entry requirements. This department overview does not establish an admission cutoff or deadline.',
    ...verified,
  },
  {
    id: 'unist-funding',
    title: 'Undergraduate scholarships',
    organization: 'UNIST Admissions',
    url: 'https://admu-intl.unist.ac.kr/admission-eng/life/scholarships.do',
    country: 'South Korea',
    topic: 'scholarship',
    authority: 'Official university',
    text: 'UNIST publishes a full tuition scholarship for all freshmen in their first term. Continued full tuition support normally requires at least 12 credits and GPA 2.7 in the previous term. The second-term freshman exception uses 12 credits and GPA 2.0. These are continuation conditions, not admission guarantees or entrance GPA thresholds.',
    ...verified,
  },
  {
    id: 'southampton-funding',
    title: 'Undergraduate scholarships for international students',
    organization: 'University of Southampton',
    url: 'https://www.southampton.ac.uk/study/fees-funding/undergraduate/scholarships',
    country: 'United Kingdom',
    topic: 'scholarship',
    authority: 'Official university',
    text: 'Southampton lists international undergraduate scholarships for students starting in 2026, including Electronics and Computer Science funding opportunities. This overview does not confirm an individual award, amount, deadline or eligibility. Review the current scholarship call and offer conditions before relying on funding.',
    ...verified,
  },
  {
    id: 'germany-visa',
    title: 'Visa for studying',
    organization: 'Make it in Germany / German government',
    url: 'https://www.make-it-in-germany.com/en/visa-residence/types/studying',
    country: 'Germany',
    topic: 'visa',
    authority: 'Official government',
    text: 'The German study visa route requires admission to a state-recognised higher education institution, sufficient living funds and language evidence where applicable. A blocked account is one funding option; the official page states EUR 11,904 for 2026. Scholarship funding or a declaration of commitment may also establish sufficient means. Check the responsible embassy checklist.',
    ...verified,
  },
  {
    id: 'korea-visa',
    title: 'Student visa and stay status',
    organization: 'Study in Korea / Korean government',
    url: 'https://studyinkorea.go.kr/ko/plan/visaAndStay.do',
    country: 'South Korea',
    topic: 'visa',
    authority: 'Official government',
    text: 'After receiving university admission, students prepare a visa application through the Korean embassy or consulate. D-2 is the degree-study category. The appropriate subtype and required documents depend on the course and circumstances; confirm the current embassy checklist before submission.',
    ...verified,
  },
];

export const additionalPrograms: Program[] = [
  {
    id: 'saarland',
    name: 'Saarland University',
    short: 'SA',
    country: 'Germany',
    city: 'Saarbrücken',
    field: 'Computer Science',
    degree: 'Bachelor',
    tuition: 200000,
    living: 3900000,
    ielts: null,
    academic: null,
    scholarship: false,
    sourceIds: ['saarland-cs', 'daad-pk'],
    caveat:
      'Restricted entry and selection tracks. Semester contribution is separate from zero tuition. Pakistani qualification recognition must be checked.',
    isDemoData: true,
    language: 'English',
    category: 'Pathway to investigate',
    academicRequirement:
      'Recognised university entrance qualification and the applicable selection track.',
    officialTuitionAmount: 0,
    tuitionCurrency: 'EUR',
    tuitionIntake: 'Published course page; semester contribution excluded',
    deadline:
      'Recurring winter: July 15; interview track June 15. Confirm current intake.',
  },
  {
    id: 'southampton',
    name: 'University of Southampton',
    short: 'SO',
    country: 'United Kingdom',
    city: 'Southampton',
    field: 'Computer Science',
    degree: 'Bachelor',
    tuition: 12500000,
    living: 4200000,
    ielts: 6.5,
    ieltsComponentMin: 6,
    academic: null,
    scholarship: true,
    sourceIds: ['southampton-cs', 'southampton-funding', 'uk-money'],
    caveat:
      'Published A-level A*AA including Mathematics A; do not convert to a Pakistani percentage. Confirm target-intake fees and equivalence.',
    isDemoData: true,
    language: 'English',
    category: 'Dream',
    academicRequirement:
      'A*AA including Mathematics at grade A or above; international equivalence requires review.',
    officialTuitionAmount: 33000,
    tuitionCurrency: 'GBP',
    tuitionIntake:
      'Annual overseas fee shown on course page, verified 2026-09-12; reconfirm selected intake',
    deadline: null,
  },
  {
    id: 'unist',
    name: 'UNIST',
    short: 'UN',
    country: 'South Korea',
    city: 'Ulsan',
    field: 'Computer Science',
    degree: 'Bachelor',
    tuition: 1800000,
    living: 1500000,
    ielts: null,
    academic: null,
    scholarship: true,
    sourceIds: ['unist-cse', 'unist-funding'],
    caveat:
      'Department and scholarship overview verified. Current international admission, major selection and language requirements still need confirmation.',
    isDemoData: true,
    language: 'Confirm current teaching language',
    category: 'Dream',
    deadline: null,
  },
];

export type Scholarship = {
  id: string;
  title: string;
  country: string;
  programIds: string[];
  degrees: string[];
  requirements: string;
  benefit: string;
  sourceIds: string[];
  deadline: string | null;
  amount: number | null;
  currency: string | null;
  period: string | null;
  continuationGpa: number | null;
  gpaScale: number | null;
  minimumCredits: number | null;
};
export const scholarships: Scholarship[] = [
  {
    id: 'kaist-scholarship',
    title: 'KAIST Scholarship',
    country: 'South Korea',
    programIds: ['kaist'],
    degrees: ['Bachelor'],
    requirements:
      'International admission required; select the scholarship in the admission application. Continuation GPA must be above 2.7/4.3 after freshman year.',
    benefit:
      'Eight semesters tuition exemption, KRW 350,000 monthly living support and health insurance.',
    sourceIds: ['kaist-funding'],
    deadline: null,
    amount: 350000,
    currency: 'KRW',
    period: 'monthly living support',
    continuationGpa: 2.7,
    gpaScale: 4.3,
    minimumCredits: null,
  },
  {
    id: 'gks-scholarship',
    title: 'Global Korea Scholarship',
    country: 'South Korea',
    programIds: [],
    degrees: ['Bachelor', 'Master', 'PhD'],
    requirements:
      'Check the current call for eligible nationalities, grades, age, universities and selection routes.',
    benefit:
      'Government funding pathway; the current call determines coverage.',
    sourceIds: ['gks'],
    deadline: null,
    amount: null,
    currency: null,
    period: null,
    continuationGpa: null,
    gpaScale: null,
    minimumCredits: null,
  },
  {
    id: 'unist-scholarship',
    title: 'UNIST undergraduate tuition scholarship',
    country: 'South Korea',
    programIds: ['unist'],
    degrees: ['Bachelor'],
    requirements:
      'Admission required. First term is covered; continued full tuition generally requires 12 credits and GPA 2.7. Second-term freshman exception: 12 credits and GPA 2.0. Confirm the grading scale with UNIST.',
    benefit:
      'Full tuition in the first freshman term; subsequent coverage depends on academic performance.',
    sourceIds: ['unist-funding'],
    deadline: null,
    amount: null,
    currency: null,
    period: 'tuition',
    continuationGpa: 2.7,
    gpaScale: null,
    minimumCredits: 12,
  },
  {
    id: 'southampton-scholarships',
    title: 'Southampton international undergraduate funding',
    country: 'United Kingdom',
    programIds: ['southampton'],
    degrees: ['Bachelor'],
    requirements:
      'Overview for 2026 entrants. Check the current ECS call, nationality and offer conditions; individual eligibility is unverified.',
    benefit:
      'Funding opportunity listed by the university; no verified amount stored.',
    sourceIds: ['southampton-funding'],
    deadline: null,
    amount: null,
    currency: null,
    period: null,
    continuationGpa: null,
    gpaScale: null,
    minimumCredits: null,
  },
];
export type VisaInfo = {
  id: string;
  country: string;
  visaType: string;
  requirements: string;
  sourceIds: string[];
  fundsAmount: number | null;
  fundsCurrency: string | null;
  fundsPeriod: string | null;
  effectiveYear: number | null;
};
export const visas: VisaInfo[] = [
  {
    id: 'de-study',
    country: 'Germany',
    visaType: 'Study visa / Section 16b',
    requirements:
      'Admission to a state-recognised institution, sufficient funds and language evidence where applicable. Confirm embassy documents and acceptable funding route.',
    sourceIds: ['germany-visa'],
    fundsAmount: 11904,
    fundsCurrency: 'EUR',
    fundsPeriod: 'annual blocked-account option',
    effectiveYear: 2026,
  },
  {
    id: 'kr-study',
    country: 'South Korea',
    visaType: 'D-2 degree study',
    requirements:
      'Apply after admission; confirm the degree subtype and current Korean embassy document checklist.',
    sourceIds: ['korea-visa'],
    fundsAmount: null,
    fundsCurrency: null,
    fundsPeriod: null,
    effectiveYear: null,
  },
  {
    id: 'uk-study',
    country: 'United Kingdom',
    visaType: 'Student visa',
    requirements:
      'First-year course fees plus living funds: GBP 1,529 monthly in London or GBP 1,171 outside, for up to nine months. Normally hold funds for 28 consecutive days ending within 31 days before application; exceptions depend on circumstances.',
    sourceIds: ['uk-money'],
    fundsAmount: 1171,
    fundsCurrency: 'GBP',
    fundsPeriod: 'monthly outside London, up to nine months',
    effectiveYear: 2026,
  },
];
