import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const dataDir = path.join(process.cwd(), "questions_data");
    
    // Read all chunk files
    let allQuestions = [];
    
    for (let i = 1; i <= 100; i++) {
      const filePath = path.join(dataDir, `chunk${i}.json`);
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const chunkQuestions = JSON.parse(fileContent);
        allQuestions = allQuestions.concat(chunkQuestions);
      }
    }
    
    res.status(200).json({
      success: true,
      totalQuestions: allQuestions.length,
      questions: allQuestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
