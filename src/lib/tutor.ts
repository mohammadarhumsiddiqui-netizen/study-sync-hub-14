/**
 * Study Sync mock AI tutor.
 * A small rule-based engine: it solves arithmetic, linear equations and
 * equations-of-motion problems, and explains common study topics.
 * No network calls — everything runs in the browser.
 */

type Rule = { match: RegExp; reply: (m: RegExpMatchArray, q: string) => string };

/** Safely evaluate a simple arithmetic expression (digits and operators only). */
function calculate(expression: string): string | null {
  const clean = expression
    .replace(/×|x(?=\s*\d)/gi, "*")
    .replace(/÷/g, "/")
    .replace(/\^/g, "**")
    .replace(/[^0-9+\-*/().\s]/g, "");
  if (!/\d/.test(clean) || !/[+\-*/]/.test(clean)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict";return (${clean})`)() as number;
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return `${clean.trim()} = **${Math.round(value * 1e6) / 1e6}**`;
  } catch {
    return null;
  }
}

/** Solve a linear equation of the form ax + b = c. */
function solveLinear(q: string): string | null {
  const m = q.match(/(-?\d*\.?\d*)\s*\*?\s*x\s*([+-]\s*\d+\.?\d*)?\s*=\s*(-?\d+\.?\d*)/i);
  if (!m) return null;
  const a = m[1] === "" || m[1] === "+" ? 1 : m[1] === "-" ? -1 : Number(m[1]);
  const b = m[2] ? Number(m[2].replace(/\s+/g, "")) : 0;
  const c = Number(m[3]);
  if (!a) return null;
  const x = (c - b) / a;
  return [
    `Let's solve **${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${c}**`,
    `1. Move the constant: ${a}x = ${c} ${b >= 0 ? "-" : "+"} ${Math.abs(b)} = ${c - b}`,
    `2. Divide by ${a}: x = ${c - b} / ${a}`,
    `**x = ${Math.round(x * 1e6) / 1e6}**`,
  ].join("\n");
}

const rules: Rule[] = [
  {
    match: /equations? of motion|newton'?s? (first|second|third)|kinematic/i,
    reply: () =>
      [
        "**Equations of motion (constant acceleration)**",
        "1. v = u + at",
        "2. s = ut + ½at²",
        "3. v² = u² + 2as",
        "",
        "u = initial velocity, v = final velocity, a = acceleration, t = time, s = displacement.",
        "Tip: list what you know, pick the equation that has only one unknown left.",
      ].join("\n"),
  },
  {
    match: /photosynthesis/i,
    reply: () =>
      [
        "**Photosynthesis** converts light energy into chemical energy:",
        "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂",
        "",
        "• Light reactions happen in the thylakoid membrane (make ATP + NADPH).",
        "• The Calvin cycle happens in the stroma (fixes CO₂ into glucose).",
      ].join("\n"),
  },
  {
    match: /pythagoras|pythagorean/i,
    reply: () =>
      "**Pythagoras' theorem:** a² + b² = c², where c is the hypotenuse.\nExample: legs 3 and 4 → c = √(9 + 16) = 5.",
  },
  {
    match: /quadratic/i,
    reply: () =>
      "**Quadratic formula:** x = (-b ± √(b² − 4ac)) / 2a for ax² + bx + c = 0.\nThe discriminant b² − 4ac tells you the number of real roots: > 0 → two, = 0 → one, < 0 → none.",
  },
  {
    match: /derivative|differentiat/i,
    reply: () =>
      "**Differentiation basics**\n• Power rule: d/dx xⁿ = n·xⁿ⁻¹\n• Product: (uv)' = u'v + uv'\n• Chain: d/dx f(g(x)) = f'(g(x))·g'(x)\nSend me a specific function and I'll walk through it.",
  },
  {
    match: /ohm'?s? law|voltage|current|resistance/i,
    reply: () =>
      "**Ohm's law:** V = I × R.\nRearranged: I = V / R, R = V / I. Power: P = V × I = I²R.",
  },
  {
    match: /periodic table|atom|electron|valency/i,
    reply: () =>
      "Atoms have protons (+), neutrons (0) in the nucleus and electrons (−) in shells (2, 8, 8...). Group number ≈ valence electrons, which drives bonding behaviour.",
  },
  {
    match: /essay|paragraph|write.*(essay|report)/i,
    reply: () =>
      "**Essay skeleton**\n1. Hook + thesis (1 sentence claim).\n2. 3 body paragraphs: point → evidence → explanation → link.\n3. Conclusion: restate thesis, widen the implication.\nKeep one idea per paragraph and cite evidence.",
  },
  {
    match: /(how|help).*(study|memor|revise|focus)|pomodoro|procrastinat/i,
    reply: () =>
      "**Study system that works**\n• 25/5 Pomodoro blocks — use the dashboard timer.\n• Active recall: close the book, write what you remember.\n• Spaced repetition: revisit after 1 day, 3 days, 1 week.\n• Interleave subjects to avoid fatigue.",
  },
  {
    match: /exam|test.*(tomorrow|soon)|revision plan/i,
    reply: () =>
      "Let's plan backwards from the exam date: split the syllabus in Exam Mastery into topics, mark the weak ones, then give each weak topic two short sessions before the exam and one recall test the day before.",
  },
  {
    match: /prayer|salah|namaz|wudu/i,
    reply: () =>
      "You can schedule the five daily prayers in **Routine & Health** with reminder times — Study Sync will ring and send a notification so study blocks never clash with prayer.",
  },
  {
    match: /water|sleep|exercise|health/i,
    reply: () =>
      "Brain-friendly basics: 7–9 hours of sleep, 2 L of water, 20 minutes of movement, and a 5-minute screen break each hour. Add them as routine habits and track the streak.",
  },
];

export function tutorReply(question: string): string {
  const q = question.trim();
  if (!q) return "Ask me anything — maths, physics, chemistry, essays or study planning.";

  if (/^(hi|hey|hello|salam|assalam)/i.test(q))
    return "Hey! I'm your Study Sync tutor. Ask a question, paste an equation, or say “plan my revision”.";

  const linear = solveLinear(q);
  if (linear) return linear;

  for (const rule of rules) {
    const m = q.match(rule.match);
    if (m) return rule.reply(m, q);
  }

  const math = calculate(q);
  if (math) return `${math}\n\nWant the working steps broken down? Ask “explain step by step”.`;

  return [
    `Here's how I'd approach **“${q}”**:`,
    "1. Identify what the question gives you and what it asks for.",
    "2. Name the concept or formula that links them.",
    "3. Solve in small steps and check units / signs at the end.",
    "",
    "Try being more specific (e.g. “solve 4x + 8 = 24”, “equations of motion”, “explain photosynthesis”) and I'll give a full worked answer.",
  ].join("\n");
}

export const TUTOR_SUGGESTIONS = [
  "Solve 4x + 8 = 24",
  "Equations of motion",
  "Explain photosynthesis",
  "How do I revise for exams?",
  "12 * 45 + 30",
];
