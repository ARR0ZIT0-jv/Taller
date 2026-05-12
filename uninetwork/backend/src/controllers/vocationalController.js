const { getDb } = require('../config/db');
const { authMiddleware } = require('../middlewares/auth');
const { calculateScores, generateProfileLabel, matchCareers, CATEGORIES, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } = require('../services/riasecEngine');

/**
 * GET /api/vocational/questions
 * Returns all questions shuffled within each category
 */
function getQuestions(req, res) {
  try {
    const db = getDb();
    const questions = db.all('SELECT id, text, category, weight, order_num FROM vocational_questions ORDER BY order_num ASC');

    // Group by category for the frontend
    const grouped = {};
    for (const cat of CATEGORIES) {
      grouped[cat] = {
        code: cat,
        label: CATEGORY_LABELS[cat],
        description: CATEGORY_DESCRIPTIONS[cat],
        questions: questions.filter(q => q.category === cat),
      };
    }

    res.json({
      total: questions.length,
      categories: CATEGORIES.map(c => grouped[c]),
      questions, // flat list too
    });
  } catch (err) {
    console.error('Get vocational questions error:', err);
    res.status(500).json({ error: 'Error al cargar preguntas.' });
  }
}

/**
 * POST /api/vocational/submit
 * Body: { answers: [{questionId, answer}] }  answer = 1-5
 */
function submitTest(req, res) {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Respuestas requeridas.' });
    }

    // Load question metadata to get category + weight
    const questions = db.all('SELECT id, category, weight FROM vocational_questions');
    const qMap = {};
    for (const q of questions) qMap[q.id] = q;

    // Merge answers with question metadata
    const enriched = answers.map(a => ({
      questionId: a.questionId,
      answer: Math.min(5, Math.max(1, parseInt(a.answer) || 3)),
      category: qMap[a.questionId]?.category || 'R',
      weight: qMap[a.questionId]?.weight || 1,
    }));

    // Calculate RIASEC scores
    const scores = calculateScores(enriched);
    const profileLabel = generateProfileLabel(scores);

    // Match against careers
    const careerVectors = db.all(`
      SELECT cr.*, c.name as career_name, c.faculty, c.duration_years, c.degree_title,
             u.name as university_name, u.acronym as university_acronym, u.country, u.city
      FROM career_riasec cr
      JOIN careers c ON cr.career_id = c.id
      JOIN universities u ON c.university_id = u.id
    `);

    const ranked = matchCareers(scores, careerVectors);
    const top5 = ranked.slice(0, 5);
    const recommendedIds = top5.map(c => c.career_id);

    // Persist result
    db.run(`
      INSERT INTO vocational_results (user_id, r_score, i_score, a_score, s_score, e_score, c_score, profile_label, recommended_careers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, userId, scores.R, scores.I, scores.A, scores.S, scores.E, scores.C, profileLabel, JSON.stringify(recommendedIds));

    res.json({
      scores,
      profileLabel,
      categoryDescriptions: CATEGORY_DESCRIPTIONS,
      categoryLabels: CATEGORY_LABELS,
      topCareers: top5,
      allRanked: ranked,
    });
  } catch (err) {
    console.error('Submit vocational test error:', err);
    res.status(500).json({ error: 'Error al procesar el test.' });
  }
}

/**
 * GET /api/vocational/results
 * Returns all past results for current user
 */
function getResults(req, res) {
  try {
    const db = getDb();
    const results = db.all(
      'SELECT * FROM vocational_results WHERE user_id = ? ORDER BY created_at DESC',
      req.user.id
    );
    res.json({ results });
  } catch (err) {
    console.error('Get vocational results error:', err);
    res.status(500).json({ error: 'Error al cargar resultados.' });
  }
}

/**
 * GET /api/vocational/results/latest
 * Returns latest result with full career recommendations
 */
function getLatestResult(req, res) {
  try {
    const db = getDb();
    const result = db.get(
      'SELECT * FROM vocational_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      req.user.id
    );

    if (!result) {
      return res.json({ result: null });
    }

    // Re-fetch career details for the recommended IDs
    const careerIds = JSON.parse(result.recommended_careers || '[]');
    let topCareers = [];
    if (careerIds.length > 0) {
      const allCareers = db.all(`
        SELECT cr.*, c.id as career_id, c.name as career_name, c.faculty, c.duration_years, c.degree_title,
               u.name as university_name, u.acronym as university_acronym, u.country, u.city
        FROM career_riasec cr
        JOIN careers c ON cr.career_id = c.id
        JOIN universities u ON c.university_id = u.id
      `);
      // filter to recommended ones preserving order
      topCareers = careerIds.map(id => allCareers.find(c => c.career_id === id)).filter(Boolean);
    }

    res.json({
      result: {
        ...result,
        scores: {
          R: result.r_score, I: result.i_score, A: result.a_score,
          S: result.s_score, E: result.e_score, C: result.c_score,
        },
      },
      topCareers,
      categoryLabels: CATEGORY_LABELS,
      categoryDescriptions: CATEGORY_DESCRIPTIONS,
    });
  } catch (err) {
    console.error('Get latest vocational result error:', err);
    res.status(500).json({ error: 'Error al cargar resultado.' });
  }
}

function seedData(req, res) {
  try {
    const db = getDb();
    db.exec(`DELETE FROM vocational_results`);
    db.exec(`DELETE FROM vocational_questions`);
    db.exec(`DELETE FROM career_riasec`);

    const vocQuestions = [
      ['Me gusta trabajar con herramientas, máquinas o equipos', 'R', 1.0, 1],
      ['Prefiero actividades al aire libre o trabajo de campo', 'R', 1.0, 2],
      ['Disfruto armar, reparar o construir cosas con mis manos', 'R', 1.0, 3],
      ['Me interesan la mecánica, la electrónica o la tecnología aplicada', 'R', 1.0, 4],
      ['Me gusta el deporte y la actividad física', 'R', 0.8, 5],
      ['Prefiero las soluciones concretas y prácticas a las teóricas', 'R', 1.0, 6],
      ['Me siento cómodo/a trabajando con planos, mapas o modelos', 'R', 1.0, 7],
      ['Me atrae el trabajo de laboratorio o taller práctico', 'R', 0.8, 8],
      ['Me gusta resolver problemas matemáticos o científicos', 'I', 1.0, 9],
      ['Disfruto investigar temas a profundidad y buscar explicaciones', 'I', 1.0, 10],
      ['Me atrae el análisis de datos y la estadística', 'I', 1.0, 11],
      ['Me interesa entender cómo funcionan las cosas a nivel fundamental', 'I', 1.0, 12],
      ['Me gusta la lectura de artículos científicos o documentales', 'I', 0.8, 13],
      ['Disfruto programar, crear algoritmos o resolver puzzles lógicos', 'I', 1.0, 14],
      ['Me interesa la biología, la química o la física', 'I', 1.0, 15],
      ['Prefiero tomar decisiones basadas en evidencia y datos', 'I', 0.8, 16],
      ['Me gusta dibujar, pintar, diseñar o hacer fotografía', 'A', 1.0, 17],
      ['Disfruto la música, la actuación o la escritura creativa', 'A', 1.0, 18],
      ['Me atrae el diseño gráfico, la moda o la decoración', 'A', 1.0, 19],
      ['Valoro la originalidad y evito seguir reglas rígidas', 'A', 0.8, 20],
      ['Me gusta imaginar espacios, edificios o ciudades', 'A', 1.0, 21],
      ['Disfruto crear contenido visual, videos o presentaciones', 'A', 1.0, 22],
      ['Me interesa la cultura, el arte y la historia', 'A', 0.8, 23],
      ['Prefiero ambientes de trabajo flexibles y creativos', 'A', 0.8, 24],
      ['Me gusta ayudar a otros a resolver sus problemas personales', 'S', 1.0, 25],
      ['Disfruto enseñar, explicar o dar tutorías', 'S', 1.0, 26],
      ['Me interesa el voluntariado y el trabajo comunitario', 'S', 0.8, 27],
      ['Soy bueno/a escuchando y comprendiendo a las personas', 'S', 1.0, 28],
      ['Me gustaría trabajar en salud, educación o servicios sociales', 'S', 1.0, 29],
      ['Me preocupo por la justicia social y los derechos humanos', 'S', 1.0, 30],
      ['Prefiero el trabajo en equipo al trabajo individual', 'S', 0.8, 31],
      ['Me motiva ver el impacto positivo de mi trabajo en otros', 'S', 0.8, 32],
      ['Me gusta liderar grupos y tomar la iniciativa', 'E', 1.0, 33],
      ['Disfruto convencer, negociar o vender ideas', 'E', 1.0, 34],
      ['Me atrae el mundo de los negocios y el emprendimiento', 'E', 1.0, 35],
      ['Me gustaría tener mi propia empresa algún día', 'E', 1.0, 36],
      ['Soy competitivo/a y orientado/a a resultados', 'E', 0.8, 37],
      ['Me interesa la política, la gestión pública o el derecho empresarial', 'E', 0.8, 38],
      ['Me siento cómodo/a hablando en público o presentando ideas', 'E', 1.0, 39],
      ['Me gusta planificar proyectos y coordinar equipos', 'E', 0.8, 40],
      ['Me gusta organizar información, archivos o bases de datos', 'C', 1.0, 41],
      ['Disfruto el trabajo con números, cálculos y hojas de cálculo', 'C', 1.0, 42],
      ['Me atraen las finanzas, la contabilidad o la auditoría', 'C', 1.0, 43],
      ['Prefiero seguir procedimientos claros y establecidos', 'C', 0.8, 44],
      ['Soy detallista y me gusta que las cosas estén bien ordenadas', 'C', 0.8, 45],
      ['Me interesa la administración, la logística o la gestión', 'C', 1.0, 46],
      ['Me siento cómodo/a con rutinas y tareas sistemáticas', 'C', 0.8, 47],
      ['Me gusta verificar datos, revisar documentos y detectar errores', 'C', 1.0, 48],
    ];

    for (const q of vocQuestions) {
      db.run('INSERT INTO vocational_questions (text, category, weight, order_num) VALUES (?, ?, ?, ?)', ...q);
    }

    const careerRiasec = [
      [1,  0.3, 0.9, 0.2, 0.1, 0.3, 0.5], // Ing. Sistemas UMSA
      [2,  0.4, 0.9, 0.1, 0.8, 0.2, 0.3], // Medicina
      [3,  0.1, 0.5, 0.2, 0.7, 0.7, 0.5], // Derecho
      [4,  0.1, 0.8, 0.1, 0.3, 0.6, 0.8], // Economía
      [5,  0.6, 0.4, 0.9, 0.2, 0.3, 0.3], // Arquitectura
      [6,  0.3, 0.9, 0.2, 0.1, 0.3, 0.5], // Ing. Sistemas UMSS
      [7,  0.7, 0.6, 0.1, 0.2, 0.5, 0.6], // Ing. Industrial
      [8,  0.1, 0.4, 0.1, 0.2, 0.4, 0.9], // Contaduría
      [9,  0.3, 0.9, 0.2, 0.1, 0.3, 0.5], // Ing. Informática UAGRM
      [10,  0.1, 0.3, 0.2, 0.4, 0.9, 0.6], // Admin Empresas UAGRM
      [11, 0.9, 0.6, 0.3, 0.1, 0.3, 0.4], // Ing. Civil
      [12, 0.3, 0.9, 0.2, 0.1, 0.3, 0.5], // Ing. Sistemas UPB
      [13, 0.1, 0.3, 0.2, 0.4, 0.9, 0.6], // Admin Empresas UPB
      [14, 0.1, 0.4, 0.2, 0.4, 0.9, 0.5], // Ing. Comercial
      [15, 0.8, 0.7, 0.2, 0.1, 0.3, 0.4], // Ing. Telecom
      [16, 0.1, 0.7, 0.4, 0.9, 0.3, 0.2], // Psicología
      [17, 0.3, 0.9, 0.2, 0.1, 0.3, 0.5], // Ing. Sistemas UPSA
      [18, 0.2, 0.2, 0.9, 0.3, 0.4, 0.2], // Diseño Gráfico
      [19, 0.2, 0.9, 0.2, 0.1, 0.2, 0.4], // Cs. Computación UBA
      [20, 0.4, 0.8, 0.1, 0.1, 0.2, 0.4], // Ing. Computación UNAM
      [21, 0.4, 0.9, 0.2, 0.1, 0.2, 0.4], // Ing. Civil Comp PUC
      [22, 0.3, 0.9, 0.2, 0.1, 0.3, 0.4], // CS MIT
    ];

    for (const cr of careerRiasec) {
      db.run('INSERT INTO career_riasec (career_id, r, i, a, s, e, c) VALUES (?, ?, ?, ?, ?, ?, ?)', ...cr);
    }

    res.json({ success: true, message: "Vocational data injected successfully" });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getQuestions, submitTest, getResults, getLatestResult, seedData };
