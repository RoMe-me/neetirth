// Curated free study routes. Links intentionally point to official or
// long-lived public sources; no account or paid course is required.
export const OFFICIAL_RESOURCES = [
  {
    type: 'Official',
    title: 'NEET UG 2026 — NTA information',
    source: 'National Testing Agency',
    description: 'Exam notices, languages, eligibility and official updates.',
    url: 'https://neet.nta.nic.in/about-department/introduction/',
    color: 'var(--blue)',
  },
  {
    type: 'Syllabus',
    title: 'NEET UG 2026 syllabus',
    source: 'National Medical Commission',
    description: 'The official Physics, Chemistry and Biology scope to check before studying.',
    url: 'https://www.nmc.org.in/MCIRest/open/getDocument?path=%2FDocuments%2FPublic%2FPortal%2FLatestNews%2FPublic+Notice_NEET_removed.pdf',
    color: 'var(--green)',
  },
  {
    type: 'Textbooks',
    title: 'NCERT textbooks on ePathshala',
    source: 'NCERT / Government of India',
    description: 'Use the current NCERT editions as the first source for Biology and Chemistry facts.',
    url: 'https://epathshala.nic.in/',
    color: 'var(--orange)',
  },
  {
    type: 'Papers',
    title: 'NTA examination portal',
    source: 'NTA',
    description: 'The safest place to verify notifications, answer keys and notices.',
    url: 'https://neet.nta.nic.in/',
    color: 'var(--violet)',
  },
]

export const STUDY_RULES = [
  {
    number: '01',
    title: 'Read the source before the shortcut',
    text: 'Do one focused NCERT pass, underline only testable lines, and keep a one-page error log. AI explanations are a second opinion, not the textbook.',
    color: 'var(--orange)',
  },
  {
    number: '02',
    title: 'Recall, then review',
    text: 'Attempt a closed-book drill first. Review every wrong and guessed answer, then repeat the same chapter after a spaced gap.',
    color: 'var(--blue)',
  },
  {
    number: '03',
    title: 'Measure speed with accuracy',
    text: 'A high score with careless guesses is not mastery. Track unanswered questions, negative marks and time per question together.',
    color: 'var(--green)',
  },
]

export const ROUTINES = [
  { label: 'Daily minimum', value: '30 Q', note: '10 Physics · 10 Chemistry · 10 Biology' },
  { label: 'Weekly checkpoint', value: '1 full mock', note: 'Review the same day; do not only record the score.' },
  { label: 'Revision loop', value: '1–3–7 days', note: 'Revisit errors after one, three and seven days.' },
]
