import { PYQ, CHAPTERS } from '../data/pyqBank.js'
import { PRACTICE as PRACTICE_BANK } from '../data/practiceBank.js'

// One small, readable audit powers the Study Hub and gives us a cheap guard
// against the data bugs that previously caused blank or random chapter tests.
const SUBJECTS = ['Physics', 'Chemistry', 'Biology']
const OPTIONS = ['A', 'B', 'C', 'D']

function validQuestion(q) {
  return Boolean(
    q && typeof q === 'object' &&
    typeof q.q === 'string' && q.q.trim() &&
    q.o && OPTIONS.every(option => typeof q.o[option] === 'string' && q.o[option].trim()) &&
    OPTIONS.includes(q.a) &&
    typeof q.e === 'string' && q.e.trim() &&
    SUBJECTS.includes(q.sub) &&
    typeof q.ch === 'string' && q.ch.trim()
  )
}

const chapterSubjects = {}
Object.entries(CHAPTERS).forEach(([subject, data]) => Object.values(data.sections).flat().forEach(chapter => {
  chapterSubjects[chapter] = [...new Set([...(chapterSubjects[chapter] || []), subject])]
}))
const allChapters = [...new Set(Object.values(CHAPTERS).flatMap(subject =>
  Object.values(subject.sections).flat()
))]

export function auditQuestionSet(questions, name = 'Questions') {
  const ids = new Set()
  const duplicateIds = []
  const invalid = []
  const missingChapter = []
  const mismatchedSubject = []
  const difficulty = { easy: 0, medium: 0, hard: 0, unknown: 0 }

  questions.forEach((q, index) => {
    const id = String(q?.id ?? `row-${index}`)
    if (ids.has(id)) duplicateIds.push(id)
    ids.add(id)
    if (!validQuestion(q)) invalid.push(id)
    if (!allChapters.includes(q?.ch)) missingChapter.push({ id, chapter: q?.ch || '—' })
    if (chapterSubjects[q?.ch] && !chapterSubjects[q.ch].includes(q?.sub)) mismatchedSubject.push({ id, subject:q?.sub, expected:chapterSubjects[q.ch] })
    const d = q?.d || q?.diff
    const bucket = Object.prototype.hasOwnProperty.call(difficulty, d) ? d : 'unknown'
    difficulty[bucket] += 1
  })

  return {
    name,
    total: questions.length,
    valid: questions.length - invalid.length,
    invalid,
    duplicateIds,
    missingChapter,
    mismatchedSubject,
    difficulty,
  }
}

export function getContentStats() {
  const bySubject = Object.fromEntries(SUBJECTS.map(subject => [subject, {
    pyq: PYQ.filter(q => q.sub === subject).length,
    practice: PRACTICE_BANK.filter(q => q.sub === subject).length,
    chapters: Object.values(CHAPTERS[subject].sections).flat().length,
  }]))

  const chapterCoverage = Object.entries(CHAPTERS).flatMap(([subject, data]) => Object.values(data.sections).flat().map(chapter => ({
    chapter,
    subject,
    pyq: PYQ.filter(q => q.ch === chapter && q.sub === subject).length,
    practice: PRACTICE_BANK.filter(q => q.ch === chapter && q.sub === subject).length,
  })))

  return {
    pyq: PYQ.length,
    practice: PRACTICE_BANK.length,
    chapters: allChapters.length,
    bySubject,
    chapterCoverage,
    pyqAudit: auditQuestionSet(PYQ, 'PYQ bank'),
    practiceAudit: auditQuestionSet(PRACTICE_BANK, 'Practice bank'),
  }
}

export const DATA_QUALITY_NOTE = {
  title: 'Use the right source for the right job',
  body: 'PYQ-tagged items are kept separate from NCERT-based practice. Generated questions are labelled and should be checked against the official syllabus and answer key before being treated as authoritative.',
  checked: 'Local schema, answer options, chapter mapping, duplicate IDs, and difficulty labels are checked in-app.',
}
