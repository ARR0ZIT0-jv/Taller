/**
 * lib/riasecEngine.js — Motor RIASEC (Holland Vocational Model)
 * Pure JS, identical logic to original — no Node dependencies.
 */

export const CATEGORIES = ['R', 'I', 'A', 'S', 'E', 'C'];

export const CATEGORY_LABELS = {
  R: 'Realista',
  I: 'Investigador',
  A: 'Artístico',
  S: 'Social',
  E: 'Emprendedor',
  C: 'Convencional',
};

export const CATEGORY_DESCRIPTIONS = {
  R: 'Prefiere trabajos prácticos, mecánicos y técnicos. Le gustan las herramientas y la actividad física.',
  I: 'Disfruta investigar, analizar datos y resolver problemas complejos. Tiene curiosidad científica.',
  A: 'Valora la creatividad, la expresión artística y la originalidad. Busca libertad creativa.',
  S: 'Le motiva ayudar, enseñar y cooperar con otros. Tiene empatía y habilidades interpersonales.',
  E: 'Es líder natural, persuasivo y orientado a resultados. Le gusta tomar decisiones y dirigir.',
  C: 'Es organizado, metódico y detallista. Prefiere estructuras claras y tareas definidas.',
};

export function calculateScores(answers) {
  const raw = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const maxPossible = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  for (const a of answers) {
    const cat = a.category;
    if (!CATEGORIES.includes(cat)) continue;
    const weight = a.weight || 1;
    raw[cat] += a.answer * weight;
    maxPossible[cat] += 5 * weight;
  }

  const scores = {};
  for (const cat of CATEGORIES) {
    scores[cat] = maxPossible[cat] > 0
      ? Math.round((raw[cat] / maxPossible[cat]) * 100)
      : 0;
  }
  return scores;
}

export function generateProfileLabel(scores) {
  const sorted = CATEGORIES
    .map(c => ({ cat: c, score: scores[c] }))
    .sort((a, b) => b.score - a.score);
  return `${CATEGORY_LABELS[sorted[0].cat]}-${CATEGORY_LABELS[sorted[1].cat]}`;
}

export function cosineSimilarity(vecA, vecB) {
  let dot = 0, magA = 0, magB = 0;
  for (const key of CATEGORIES) {
    const a = vecA[key] || 0;
    const b = vecB[key] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export function matchCareers(userScores, careerVectors) {
  const userVec = {
    R: userScores.R, I: userScores.I, A: userScores.A,
    S: userScores.S, E: userScores.E, C: userScores.C,
  };
  const results = careerVectors.map(cv => {
    const careerVec = {
      R: cv.r * 100, I: cv.i * 100, A: cv.a * 100,
      S: cv.s * 100, E: cv.e * 100, C: cv.c * 100,
    };
    const similarity = cosineSimilarity(userVec, careerVec);
    return { ...cv, similarity: Math.round(similarity * 100) };
  });
  return results.sort((a, b) => b.similarity - a.similarity);
}
