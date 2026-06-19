# Neetirth Questions Generation & API Setup

## Overview
This setup generates 100,000 NEET questions (100 chunks × 1,000 questions) and serves them via an API.

## Files Created

### 1. **scripts/generate-questions.js**
- Generates all 100 question chunks
- Creates `questions_data/chunk1.json` through `questions_data/chunk100.json`
- Each chunk contains 1,000 questions with:
  - Question ID
  - Subject (Physics, Chemistry, Biology)
  - Chapter
  - Difficulty (Easy, Medium, Hard)
  - Question text, options, answer, explanation

### 2. **pages/api/questions.js**
- Next.js API route that serves all questions
- Automatically reads all 100 chunk files
- Returns combined JSON with total count and all questions
- Error handling included

### 3. **package.json (updated)**
- Added script: `npm run generate:questions`

## Setup Instructions

### Step 1: Generate Questions
```bash
npm run generate:questions
```
This creates the `questions_data/` directory with 100 JSON files.

### Step 2: Run Development Server
```bash
npm run dev
```

### Step 3: Access the API
Visit: `http://localhost:3000/api/questions`

Response format:
```json
{
  "success": true,
  "totalQuestions": 100000,
  "questions": [
    {
      "id": 1,
      "subject": "Physics",
      "chapter": "Mechanics",
      "difficulty": "Easy",
      "question": "Sample Easy question 1 from Mechanics (Physics)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "Explanation for question 1 in Mechanics."
    },
    ...
  ]
}
```

## Deployment on Vercel

1. Push to GitHub:
```bash
git add .
git commit -m "Add question generation system"
git push origin main
```

2. Run generation before deployment:
```bash
npm run generate:questions
git add questions_data/
git commit -m "Add generated question chunks"
git push origin main
```

3. Deploy to Vercel (automatically picks up from GitHub)

## Notes
- Each chunk file is ~200KB
- Total data: ~20MB uncompressed
- Generation takes ~2-3 seconds
- `.gitignore` prevents uploading questions_data/ by default
- Remove `questions_data/` from .gitignore if you want to commit generated data

## API Query Examples

### Get all questions:
```javascript
const response = await fetch('/api/questions');
const data = await response.json();
console.log(data.totalQuestions); // 100000
```

### Filter on frontend:
```javascript
const physicsQuestions = data.questions.filter(q => q.subject === 'Physics');
const easyQuestions = data.questions.filter(q => q.difficulty === 'Easy');
```
