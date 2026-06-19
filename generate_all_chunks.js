const fs = require("fs");

function generateQuestion(id, subject, chapter, difficulty) {
  return {
    id,
    subject,
    chapter,
    difficulty,
    question: `Sample ${difficulty} question ${id} from ${chapter} (${subject})`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    answer: "Option A",
    explanation: `Explanation for question ${id} in ${chapter}.`
  };
}

function generateChunk(startId, endId, chunkName) {
  const subjects = ["Physics", "Chemistry", "Biology"];
  const chapters = {
    Physics: ["Mechanics", "Optics", "Thermodynamics", "Electrostatics", "Waves"],
    Chemistry: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Atomic Structure", "Periodic Table"],
    Biology: ["Genetics", "Cell Biology", "Human Physiology", "Plant Physiology", "Ecology"]
  };
  const difficulties = ["Easy", "Medium", "Hard"];

  let questions = [];
  for (let id = startId; id <= endId; id++) {
    const subject = subjects[id % subjects.length];
    const chapterList = chapters[subject];
    const chapter = chapterList[id % chapterList.length];
    const difficulty = difficulties[id % difficulties.length];
    questions.push(generateQuestion(id, subject, chapter, difficulty));
  }

  fs.writeFileSync(`${chunkName}.json`, JSON.stringify(questions, null, 2));
  console.log(`${chunkName}.json created with ${questions.length} questions`);
}

// 🚀 Generate all 100 chunks (1000 questions each)
for (let i = 0; i < 100; i++) {
  const startId = i * 1000 + 1;
  const endId = (i + 1) * 1000;
  generateChunk(startId, endId, `questions_chunk${i + 1}`);
}

console.log("✅ All 100 chunks generated successfully!");
