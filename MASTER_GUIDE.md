# 🏛 NEETIRTH — COMPLETE MASTER GUIDE
> Free NEET mock test platform for every aspirant.
> Built by Bndhu. If this chat is lost — everything you need is right here.

---

## 🔗 CRITICAL LINKS (Save These)

| What | Link |
|------|------|
| **Live Website** | https://neetirth.vercel.app (after Vercel connects) |
| **GitHub Repo** | https://github.com/RoMe-me/neetirth |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Claude Chat (Chemistry)** | Your Claude.ai Chemistry project |

---

## 🏗 PROJECT STRUCTURE

```
neetirth/
├── src/
│   ├── App.jsx                  ← Main router (7 pages)
│   ├── main.jsx                 ← React entry point
│   ├── pages/
│   │   ├── Landing.jsx          ← Username entry page
│   │   ├── Home.jsx             ← Dashboard with AIR card
│   │   ├── MockSetup.jsx        ← Full/Subject/Chapter mock setup
│   │   ├── Exam.jsx             ← Exam room (timer, palette, submit)
│   │   ├── Results.jsx          ← Score + AIR prediction + review
│   │   └── Progress.jsx         ← History + weakness tracker
│   ├── lib/
│   │   ├── storage.js           ← localStorage (prefix: neetirth_)
│   │   └── airPredictor.js      ← NTA 2025 calibrated AIR formula
│   └── data/
│       └── pyqBank.js           ← 261 PYQs (2006–2026) + all functions
├── api/
│   └── generate.js              ← Vercel serverless (Anthropic proxy)
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

---

## 📊 NEET FORMAT (Non-negotiable)

| Subject | Questions | Marks |
|---------|-----------|-------|
| Physics | 45Q | 180 |
| Chemistry | 45Q | 180 |
| Biology (Botany + Zoology) | 90Q | 360 |
| **TOTAL** | **180Q** | **720** |

- ✅ Correct answers: **+4 marks**
- ❌ Wrong answers: **−1 mark**
- ⭕ Unanswered: **0 marks**
- ⏱ Time: **3 hours 20 minutes (12,000 seconds)**

---

## 🗃 QUESTION BANK (pyqBank.js)

- **Total questions: 261** (as of June 2026)
- Chemistry: 71Q | Physics: 69Q | Biology: 121Q
- Source: Real NEET PYQs 2006–2026
- All 86 NEET syllabus chapters covered
- Format inside file:
```js
{id:"c1", y:2006, q:"Question text",
 o:{A:"Option A", B:"Option B", C:"Option C", D:"Option D"},
 a:"D",              // correct answer
 e:"Explanation",    // shown after mock
 ch:"Chapter Name",  // must match CHAPTERS keys exactly
 sub:"Chemistry",    // Chemistry / Physics / Biology
 d:"easy"}           // easy / medium / hard
```

### Adding new questions:
1. Open `src/data/pyqBank.js` on GitHub
2. Add question objects to the `PYQ` array (before the closing `];`)
3. Commit → Vercel auto-deploys in ~30 seconds

---

## 🚀 HOW TO DEPLOY CHANGES

### Via GitHub (easiest):
1. Go to github.com/RoMe-me/neetirth
2. Navigate to the file you want to edit
3. Click the pencil ✏️ icon
4. Make changes → "Commit changes"
5. Vercel auto-deploys in ~30 seconds ✅

### Via Claude (recommended for big changes):
1. Open Claude → Chemistry project chat
2. Describe what you want changed
3. Claude writes the code, pushes to GitHub using your token
4. Vercel auto-deploys

### GitHub Token (for Claude to push):
- Go to: github.com/settings/tokens → Generate new token **(classic)**
- Check: `repo` scope only
- Expiry: 30 days
- Give to Claude when pushing

---

## 🌐 VERCEL SETUP (one-time)

1. vercel.com/new → Import `RoMe-me/neetirth`
2. Framework: **Vite** (auto-detected)
3. Deploy → done
4. Settings → Environment Variables → Add:
   ```
   ANTHROPIC_API_KEY = sk-ant-...your key...
   ```

---

## 🔧 WEEKLY CHECKUP (Every Monday)

Paste this into Claude chat:
> "Run the weekly Neetirth audit — check all files, question bank integrity, build, chapter coverage, and fix anything broken."

Claude will:
- Read every file
- Run automated checks
- Fix any bugs found
- Push fixes to GitHub
- Report results

---

## 💾 DATA STORAGE

All user data is stored in **browser localStorage** with prefix `neetirth_`:

| Key | What it stores |
|-----|----------------|
| `neetirth_user` | Username + join date |
| `neetirth_history` | All mock attempts + scores |
| `neetirth_weakness` | Chapter-wise accuracy |
| `neetirth_resume` | Unfinished mock (auto-save) |

⚠️ **Important**: Data is per-device, per-browser. If user clears browser data, their history is lost.
Phase 2 plan: Supabase database for cloud sync.

---

## 🎯 AIR PREDICTOR

Calibrated to **NTA 2025 official data**, adjusted **+17%** for NEET 2027 competition (~26L students):

| Mock Score | Predicted AIR | College |
|-----------|--------------|---------|
| 700+ | Top 50 | AIIMS Delhi |
| 670+ | Top 300 | All AIIMS / JIPMER |
| 650+ | Top 2000 | MAMC, VMMC |
| 600+ | Top 25,000 | Govt MBBS (AIQ) |
| 550+ | Top 1 Lakh | State quota MBBS |
| 470+ | Top 4 Lakh | Private MBBS |

Formula in `src/lib/airPredictor.js` — update annually after NTA releases results.

---

## 📅 ROADMAP

### Phase 1 (Done ✅)
- Full 180Q / 720 marks NEET mock
- Chapter-wise + subject-wise practice
- AIR prediction (NTA 2025 calibrated)
- Resume + auto-save
- Weakness tracker
- Score trend graph
- 261 real PYQs across all chapters

### Phase 2 (Next)
- Supabase leaderboard (compare with other users)
- Real-time rank among users who gave same mock
- Cloud sync (history across devices)

### Phase 3
- Ask AI page (type or photo a question → instant answer)
- Anthropic vision API for image questions

---

## 🐛 KNOWN BUGS FIXED (History)

| Bug | Fix Applied |
|-----|------------|
| Submit button not working | Replaced `window.confirm` with custom modal |
| Chapter mock giving random questions | Removed silent fallback in `getOfflineQs` |
| Resume not showing on dashboard | Fixed state update after `saveAndGoHome` |
| Biology showing 60Q instead of 90Q | Fixed `getOfflineFull()` + all UI |
| Timer `useEffect` wrong dependency | Changed `[paused, timeLeft > 0]` → `[paused, timeLeft]` |
| `examData` null crash on resume | Added null guard in `initState()` |
| Chapter sort `NaN` error | Made sort function NaN-safe |
| `window._confirmClear` global hack | Replaced with React state |

---

## 📞 REBUILD FROM SCRATCH (if needed)

If everything breaks, the full codebase is on GitHub. To rebuild locally:

```bash
git clone https://github.com/RoMe-me/neetirth
cd neetirth
npm install
npm run dev     # local dev server
npm run build   # production build
```

---

## 💬 HOW TO WORK WITH CLAUDE

Tell Claude exactly what's wrong or what you want. Examples:

- *"The submit button is broken again"* → Claude reads Exam.jsx, finds bug, fixes it
- *"Add 10 more questions for Chemical Kinetics"* → Claude writes questions in correct format, pushes to GitHub
- *"Redesign the results page"* → Claude rewrites Results.jsx
- *"Run the weekly audit"* → Claude checks everything, reports, fixes

Always give Claude the GitHub classic token when it needs to push code.

---

*Last updated: June 2026 | Platform: Neetirth | Built for every NEET 2027 aspirant*
