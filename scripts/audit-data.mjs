import { CHAPTERS, PYQ } from '../src/data/pyqBank.js'
import { PRACTICE } from '../src/data/practiceBank.js'

const subjects = ['Physics', 'Chemistry', 'Biology']
const options = ['A', 'B', 'C', 'D']
const chapterSubjects = {}
let subjectMappings = 0
for (const [subject, data] of Object.entries(CHAPTERS)) {
  for (const chapter of Object.values(data.sections).flat()) {
    subjectMappings++
    chapterSubjects[chapter] = [...new Set([...(chapterSubjects[chapter] || []), subject])]
  }
}

let failed = false
const audit = (name, bank) => {
  const ids = new Set()
  let invalid = 0
  let mismatched = 0
  for (const q of bank) {
    if (ids.has(q.id)) { console.error(`${name}: duplicate id ${q.id}`); failed = true }
    ids.add(q.id)
    const valid = q?.q && q?.e && q?.o && options.every(option => q.o[option]) && options.includes(q.a) && subjects.includes(q.sub) && chapterSubjects[q.ch]
    if (!valid) { invalid++; console.error(`${name}: invalid record ${q?.id || '(missing id)'}`) }
    if (chapterSubjects[q.ch] && !chapterSubjects[q.ch].includes(q.sub)) { mismatched++; console.error(`${name}: ${q.id} is tagged ${q.sub} but ${q.ch} belongs to ${chapterSubjects[q.ch].join('/')}`) }
  }
  console.log(`${name}: ${bank.length} records · ${bank.length - invalid} valid · ${mismatched} subject mismatches`)
  if (invalid || mismatched) failed = true
}

audit('PYQ bank', PYQ)
audit('Practice bank', PRACTICE)
console.log(`Syllabus map: ${Object.keys(chapterSubjects).length} unique names · ${subjectMappings} subject mappings`)
if (Object.keys(chapterSubjects).length !== 85 || subjectMappings !== 87) {
  console.error('Syllabus map count changed; review the chapter map before shipping.')
  failed = true
}
if (failed) process.exit(1)
