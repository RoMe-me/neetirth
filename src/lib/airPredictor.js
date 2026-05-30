// Calibrated to official NTA NEET 2025 data (22.1L appeared)
// Adjusted +8% for 2027 competition (~26L expected)

const NTA_2025 = [
  { marks: 686, air: 1 },   { marks: 680, air: 10 },
  { marks: 670, air: 70 },  { marks: 660, air: 300 },
  { marks: 650, air: 800 }, { marks: 640, air: 2000 },
  { marks: 630, air: 4500 },{ marks: 620, air: 8000 },
  { marks: 610, air: 13000},{ marks: 600, air: 20000},
  { marks: 590, air: 30000},{ marks: 580, air: 43000},
  { marks: 570, air: 58000},{ marks: 560, air: 75000},
  { marks: 550, air: 95000},{ marks: 540, air:118000},
  { marks: 530, air:145000},{ marks: 510, air:190000},
  { marks: 490, air:260000},{ marks: 470, air:360000},
  { marks: 450, air:480000},{ marks: 430, air:620000},
  { marks: 400, air:850000},{ marks: 360, air:1200000},
  { marks: 320, air:1600000},{ marks: 280, air:2000000},
];

// 2027 adjustment factor (26L vs 22.1L → ~17% more competition)
const FACTOR_2027 = 1.17;

export function predictAIR(score) {
  if (score > 720) score = 720;
  if (score < 0) score = 0;

  // Find bounding entries
  let upper = NTA_2025[0], lower = NTA_2025[NTA_2025.length - 1];
  for (let i = 0; i < NTA_2025.length - 1; i++) {
    if (score <= NTA_2025[i].marks && score >= NTA_2025[i + 1].marks) {
      upper = NTA_2025[i]; lower = NTA_2025[i + 1]; break;
    }
  }
  if (score >= NTA_2025[0].marks) { upper = lower = NTA_2025[0]; }
  if (score <= NTA_2025[NTA_2025.length-1].marks) { upper = lower = NTA_2025[NTA_2025.length-1]; }

  let airBase;
  if (upper.marks === lower.marks) {
    airBase = upper.air;
  } else {
    const t = (upper.marks - score) / (upper.marks - lower.marks);
    airBase = Math.round(upper.air + t * (lower.air - upper.air));
  }

  const air2027 = Math.round(airBase * FACTOR_2027);
  const airLow = Math.round(air2027 * 0.85);
  const airHigh = Math.round(air2027 * 1.15);

  const percentile = Math.max(0, Math.min(99.9999, (1 - air2027 / 2200000) * 100));

  let tier, college, color;
  if (score >= 700) { tier = "AIIMS Delhi"; college = "AIIMS Delhi is reachable"; color = "#FFD700"; }
  else if (score >= 670) { tier = "AIIMS / Top Govt"; college = "All AIIMS, JIPMER"; color = "#FFD700"; }
  else if (score >= 640) { tier = "Top Govt MBBS"; college = "MAMC, VMMC, top state colleges"; color = "#00E5AA"; }
  else if (score >= 600) { tier = "Govt MBBS (AIQ)"; college = "Government MBBS almost certain"; color = "#00E5AA"; }
  else if (score >= 560) { tier = "State Quota MBBS"; college = "Government MBBS via state quota"; color = "#00E5AA"; }
  else if (score >= 500) { tier = "Private MBBS / BAMS"; college = "Private MBBS or BAMS/BUMS"; color = "#FFAA00"; }
  else if (score >= 400) { tier = "BDS / AYUSH"; college = "BDS, BAMS, BHMS options"; color = "#FFAA00"; }
  else { tier = "Qualifying Zone"; college = "Focus: cross 360+ cutoff first"; color = "#FF5588"; }

  return { air2027, airLow, airHigh, percentile: percentile.toFixed(4), tier, college, color };
}

export function getCollegeTierTargets() {
  return [
    { target: "AIIMS Delhi",       minMarks: 700, minAIR: "Top 50",    color: "#FFD700" },
    { target: "All AIIMS / JIPMER",minMarks: 670, minAIR: "Top 300",   color: "#FFD700" },
    { target: "MAMC / VMMC Delhi", minMarks: 650, minAIR: "Top 2000",  color: "#00E5AA" },
    { target: "Govt MBBS (AIQ)",   minMarks: 600, minAIR: "Top 25000", color: "#00E5AA" },
    { target: "State Quota MBBS",  minMarks: 550, minAIR: "Top 1 Lakh",color: "#4D9FFF" },
    { target: "Private MBBS",      minMarks: 470, minAIR: "Top 4 Lakh",color: "#FFAA00" },
  ];
}
