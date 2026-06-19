const fs = require("fs");
const path = require("path");

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

function generateChunk(startId, endId, chunkNumber) {
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

  return questions;
}

// Create questions_data directory if it doesn't exist
const dataDir = path.join(__dirname, "questions_data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Generate all 100 chunks
console.log("🚀 Starting generation of 100 question chunks...");
for (let i = 0; i < 100; i++) {
  const startId = i * 1000 + 1;
  const endId = (i + 1) * 1000;
  const chunkNumber = i + 1;
  
  const questions = generateChunk(startId, endId, chunkNumber);
  const filePath = path.join(dataDir, `chunk${chunkNumber}.json`);
  
  fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
  console.log(`✅ Chunk ${chunkNumber} created (Questions ${startId}-${endId})`);
}

console.log("\n✨ All 100 chunks generated successfully!");
console.log("📁 Files saved in: questions_data/");
