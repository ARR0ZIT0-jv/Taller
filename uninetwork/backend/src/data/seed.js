const { initDb, saveDb } = require('../config/db');
const { initializeDatabase } = require('../models/schema');
const bcrypt = require('bcryptjs');

async function seed() {
  const db = await initDb();
  initializeDatabase();

  // Clear existing data
  db.exec(`DELETE FROM vocational_results`);
  db.exec(`DELETE FROM vocational_questions`);
  db.exec(`DELETE FROM career_riasec`);
  db.exec(`DELETE FROM post_likes`);
  db.exec(`DELETE FROM comments`);
  db.exec(`DELETE FROM posts`);
  db.exec(`DELETE FROM connections`);
  db.exec(`DELETE FROM users`);
  db.exec(`DELETE FROM careers`);
  db.exec(`DELETE FROM universities`);

  // ──────────── UNIVERSITIES ────────────
  const universities = [
    // Bolivia - Públicas
    ['Universidad Mayor de San Andrés', 'UMSA', 'Bolivia', 'La Paz', 'publica',
      'Principal universidad pública de La Paz, fundada en 1830. Referente académico de Bolivia.',
      'https://www.umsa.bo'],
    ['Universidad Mayor de San Simón', 'UMSS', 'Bolivia', 'Cochabamba', 'publica',
      'Universidad pública líder en Cochabamba con amplia oferta académica.',
      'https://www.umss.edu.bo'],
    ['Universidad Autónoma Gabriel René Moreno', 'UAGRM', 'Bolivia', 'Santa Cruz', 'publica',
      'La universidad más grande de Bolivia por número de estudiantes.',
      'https://www.uagrm.edu.bo'],
    ['Universidad Autónoma Tomás Frías', 'UATF', 'Bolivia', 'Potosí', 'publica',
      'Universidad pública histórica de Potosí.',
      'https://www.uatf.edu.bo'],
    ['Universidad Técnica de Oruro', 'UTO', 'Bolivia', 'Oruro', 'publica',
      'Referente técnico y científico del departamento de Oruro.',
      'https://www.uto.edu.bo'],
    ['Universidad Autónoma Juan Misael Saracho', 'UAJMS', 'Bolivia', 'Tarija', 'publica',
      'Principal casa de estudios superiores del departamento de Tarija.',
      'https://www.uajms.edu.bo'],

    // Bolivia - Privadas
    ['Universidad Privada Boliviana', 'UPB', 'Bolivia', 'Cochabamba', 'privada',
      'Universidad privada de alto prestigio con campus en Cochabamba y La Paz.',
      'https://www.upb.edu'],
    ['Universidad Católica Boliviana San Pablo', 'UCB', 'Bolivia', 'La Paz', 'privada',
      'Red universitaria católica con sedes en múltiples ciudades.',
      'https://www.ucb.edu.bo'],
    ['Universidad Privada de Santa Cruz de la Sierra', 'UPSA', 'Bolivia', 'Santa Cruz', 'privada',
      'Universidad privada líder en Santa Cruz, orientada a la innovación.',
      'https://www.upsa.edu.bo'],
    ['Universidad del Valle', 'UNIVALLE', 'Bolivia', 'Cochabamba', 'privada',
      'Universidad privada con enfoque en tecnología y negocios.',
      'https://www.univalle.edu'],

    // Extranjeras
    ['Universidad de Buenos Aires', 'UBA', 'Argentina', 'Buenos Aires', 'publica',
      'Una de las universidades más prestigiosas de Latinoamérica.',
      'https://www.uba.ar'],
    ['Universidad Nacional Autónoma de México', 'UNAM', 'México', 'Ciudad de México', 'publica',
      'La universidad más grande de Iberoamérica.',
      'https://www.unam.mx'],
    ['Pontificia Universidad Católica de Chile', 'PUC', 'Chile', 'Santiago', 'privada',
      'Mejor universidad de Chile y una de las líderes en Latinoamérica.',
      'https://www.uc.cl'],
    ['Universidad de São Paulo', 'USP', 'Brasil', 'São Paulo', 'publica',
      'Principal universidad de investigación de Brasil.',
      'https://www.usp.br'],
    ['Massachusetts Institute of Technology', 'MIT', 'Estados Unidos', 'Cambridge', 'privada',
      'Líder mundial en ciencia, tecnología e ingeniería.',
      'https://www.mit.edu'],
  ];

  const uniIds = {};
  for (const u of universities) {
    const result = db.run(
      `INSERT INTO universities (name, acronym, country, city, type, description, website) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ...u
    );
    uniIds[u[1]] = result.lastInsertRowid;
  }

  // ──────────── CAREERS ────────────
  const careers = [
    // UMSA
    [uniIds['UMSA'], 'Ingeniería de Sistemas', 'Facultad de Ciencias Puras y Naturales', 5, 'Licenciatura en Ingeniería de Sistemas',
      'Programación, Bases de Datos, Redes, Inteligencia Artificial, Ingeniería de Software, Sistemas Operativos, Matemáticas Computacionales'],
    [uniIds['UMSA'], 'Medicina', 'Facultad de Medicina', 6, 'Médico Cirujano',
      'Anatomía, Fisiología, Bioquímica, Farmacología, Patología, Cirugía, Medicina Interna, Pediatría'],
    [uniIds['UMSA'], 'Derecho', 'Facultad de Derecho y Ciencias Políticas', 5, 'Licenciatura en Derecho',
      'Derecho Civil, Penal, Constitucional, Administrativo, Internacional, Procesal, Laboral'],
    [uniIds['UMSA'], 'Economía', 'Facultad de Ciencias Económicas y Financieras', 5, 'Licenciatura en Economía',
      'Microeconomía, Macroeconomía, Econometría, Finanzas Públicas, Economía Internacional, Estadística'],
    [uniIds['UMSA'], 'Arquitectura', 'Facultad de Arquitectura, Artes, Diseño y Urbanismo', 5, 'Licenciatura en Arquitectura',
      'Diseño Arquitectónico, Urbanismo, Estructuras, Historia del Arte, CAD, Planificación Territorial'],

    // UMSS
    [uniIds['UMSS'], 'Ingeniería de Sistemas', 'Facultad de Ciencias y Tecnología', 5, 'Licenciatura en Ingeniería de Sistemas',
      'Algoritmos, Programación, Redes, Bases de Datos, IA, Desarrollo Web, Seguridad Informática'],
    [uniIds['UMSS'], 'Ingeniería Industrial', 'Facultad de Ciencias y Tecnología', 5, 'Licenciatura en Ingeniería Industrial',
      'Gestión de Producción, Control de Calidad, Logística, Investigación Operativa, Ergonomía'],
    [uniIds['UMSS'], 'Contaduría Pública', 'Facultad de Ciencias Económicas', 5, 'Licenciatura en Contaduría Pública',
      'Contabilidad, Auditoría, Tributación, Costos, Finanzas, Legislación Comercial'],

    // UAGRM
    [uniIds['UAGRM'], 'Ingeniería Informática', 'Facultad de Ingeniería en Ciencias de la Computación', 5, 'Licenciatura en Ingeniería Informática',
      'Programación, Desarrollo de Software, Redes, Seguridad, Bases de Datos, Cloud Computing'],
    [uniIds['UAGRM'], 'Administración de Empresas', 'Facultad de Ciencias Empresariales', 4, 'Licenciatura en Administración de Empresas',
      'Marketing, Finanzas, Recursos Humanos, Planificación Estratégica, Emprendimiento'],
    [uniIds['UAGRM'], 'Ingeniería Civil', 'Facultad de Tecnología', 5, 'Licenciatura en Ingeniería Civil',
      'Estructuras, Hidráulica, Geotecnia, Vías de Comunicación, Construcción, Topografía'],

    // UPB
    [uniIds['UPB'], 'Ingeniería de Sistemas Computacionales', 'Departamento de Ciencias Exactas e Ingeniería', 5, 'Licenciatura en Ingeniería de Sistemas',
      'Software Engineering, Data Science, Machine Learning, Cloud, DevOps, Mobile Development'],
    [uniIds['UPB'], 'Administración de Empresas', 'Departamento de Ciencias Empresariales', 4, 'Licenciatura en Administración de Empresas',
      'Strategy, Marketing Digital, Finance, Operations, Leadership, Entrepreneurship'],
    [uniIds['UPB'], 'Ingeniería Comercial', 'Departamento de Ciencias Empresariales', 4, 'Licenciatura en Ingeniería Comercial',
      'Economía, Negocios Internacionales, Marketing, Investigación de Mercados, Emprendimiento'],

    // UCB
    [uniIds['UCB'], 'Ingeniería de Telecomunicaciones', 'Facultad de Ingeniería', 5, 'Licenciatura en Ingeniería de Telecomunicaciones',
      'Señales, Telecomunicaciones, Redes, Electrónica, Fibra Óptica, Comunicaciones Satelitales'],
    [uniIds['UCB'], 'Psicología', 'Facultad de Ciencias Humanas y Sociales', 5, 'Licenciatura en Psicología',
      'Psicología Clínica, Social, Organizacional, Educativa, Neuropsicología, Investigación'],

    // UPSA
    [uniIds['UPSA'], 'Ingeniería de Sistemas', 'Facultad de Ingeniería', 4, 'Licenciatura en Ingeniería de Sistemas',
      'Desarrollo de Software, UX/UI, Cloud Computing, Ciberseguridad, Mobile, AI/ML'],
    [uniIds['UPSA'], 'Diseño Gráfico y Comunicación Visual', 'Facultad de Diseño', 4, 'Licenciatura en Diseño Gráfico',
      'Diseño Digital, Branding, UX/UI, Fotografía, Animación, Producción Audiovisual'],

    // Extranjeras
    [uniIds['UBA'], 'Ciencias de la Computación', 'Facultad de Ciencias Exactas y Naturales', 5, 'Licenciatura en Ciencias de la Computación',
      'Álgebra, Algoritmos, Teoría de Computabilidad, IA, Bases de Datos, Ingeniería de Software'],
    [uniIds['UNAM'], 'Ingeniería en Computación', 'Facultad de Ingeniería', 5, 'Ingeniero en Computación',
      'Programación, Circuitos, Sistemas Operativos, Redes, IA, Procesamiento de Señales'],
    [uniIds['PUC'], 'Ingeniería Civil en Computación', 'Escuela de Ingeniería', 6, 'Ingeniero Civil en Computación',
      'Matemáticas, Algoritmos, Software Engineering, Machine Learning, Data Mining, HCI'],
    [uniIds['MIT'], 'Computer Science and Engineering', 'School of Engineering', 4, 'Bachelor of Science',
      'Algorithms, AI, Machine Learning, Robotics, Systems, Theory of Computation, HCI'],
  ];

  const careerIds = [];
  for (const c of careers) {
    const result = db.run(
      `INSERT INTO careers (university_id, name, faculty, duration_years, degree_title, curriculum_summary) VALUES (?, ?, ?, ?, ?, ?)`,
      ...c
    );
    careerIds.push(result.lastInsertRowid);
  }

  // ──────────── USERS ────────────
  const passwordHash = bcrypt.hashSync('demo1234', 10);

  const demoUsers = [
    ['María Fernanda López', 'maria@uninetwork.bo', passwordHash,
      bcrypt.hashSync('7654321', 10), 'Bolivia', 'university', uniIds['UMSA'], careerIds[0],
      'Estudiante de Ingeniería de Sistemas apasionada por la IA 🤖',
      'Inteligencia Artificial, Desarrollo Web, Machine Learning', 2027,
      '/images/avatar-maria.png'],
    ['Carlos Eduardo Mamani', 'carlos@uninetwork.bo', passwordHash,
      bcrypt.hashSync('8765432', 10), 'Bolivia', 'university', uniIds['UMSS'], careerIds[5],
      'Futuro ingeniero de sistemas. Amante del código limpio ☕',
      'Backend Development, Cloud Computing, DevOps', 2026,
      '/images/avatar-carlos.png'],
    ['Ana Lucía Vargas', 'ana@uninetwork.bo', passwordHash,
      bcrypt.hashSync('9876543', 10), 'Bolivia', 'university', uniIds['UPB'], careerIds[11],
      'UPBiana orgullosa 💚 Data Science y ML',
      'Data Science, Startups, Innovación', 2026,
      '/images/avatar-ana.png'],
    ['Roberto Quispe Flores', 'roberto@uninetwork.bo', passwordHash,
      bcrypt.hashSync('6543210', 10), 'Bolivia', 'university', uniIds['UAGRM'], careerIds[8],
      'Cruceño de corazón, informático de profesión 🖥️',
      'Ciberseguridad, Redes, Hardware', 2028,
      '/images/avatar-roberto.png'],
    ['Valentina Salazar', 'valentina@uninetwork.bo', passwordHash,
      bcrypt.hashSync('5432109', 10), 'Bolivia', 'high_school', null, null,
      'Estudiante de 6to de secundaria. Buscando mi carrera ideal 🎓',
      'Medicina, Biología, Investigación', 2026,
      '/images/avatar-valentina.png'],
    ['Diego Alejandro Torres', 'diego@uninetwork.bo', passwordHash,
      bcrypt.hashSync('4321098', 10), 'Bolivia', 'high_school', null, null,
      'Promo 2026! Quiero estudiar ingeniería 🚀',
      'Tecnología, Programación, Robótica', 2026,
      ''],
  ];

  const userIds = [];
  for (const u of demoUsers) {
    const result = db.run(
      `INSERT INTO users (full_name, email, password_hash, ci_hash, ci_country, academic_status, university_id, career_id, bio, interests, graduation_year, profile_pic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ...u
    );
    userIds.push(result.lastInsertRowid);
  }

  // ──────────── POSTS ────────────
  const posts = [
    [userIds[0], '¡Hoy aprobé mi defensa de proyecto de grado! 🎉 Gracias a todos los que me apoyaron en este camino. #UMSA #IngenieríaDeSistemas', 24,
      '2026-04-15 10:30:00'],
    [userIds[1], 'Alguien de la UMSS que quiera armar un grupo de estudio para Bases de Datos II? Estamos buscando gente comprometida 📚', 8,
      '2026-04-15 09:15:00'],
    [userIds[2], 'Acabo de terminar mi proyecto de Machine Learning: un clasificador de imágenes con 97% de accuracy 🤖 Vale la pena las noches sin dormir jaja', 31,
      '2026-04-14 22:40:00'],
    [userIds[3], 'La UAGRM acaba de abrir convocatoria para la feria de tecnología. ¿Alguien más se anima a participar? 💻', 12,
      '2026-04-14 16:00:00'],
    [userIds[4], 'Estoy entre Medicina y Bioquímica... ¿Algún estudiante universitario que pueda contarme su experiencia? 🤔 #Promoción2026', 15,
      '2026-04-14 14:20:00'],
    [userIds[5], 'Acabo de usar el buscador de UniNetwork y encontré que la UPB tiene un programa increíble de Ingeniería de Sistemas! Alguien que estudie ahí? 🔍', 9,
      '2026-04-13 11:00:00'],
    [userIds[0], 'Tip para los nuevos en programación: no tengan miedo de romper cosas. Así se aprende 💪 #CodingTips', 42,
      '2026-04-13 08:00:00'],
    [userIds[2], 'Orgullosa de representar a la UPB en el Hackathon Nacional 2026 🏆 #UPB #Tech', 28,
      '2026-04-12 19:30:00'],
  ];

  const postIds = [];
  for (const p of posts) {
    const result = db.run(
      `INSERT INTO posts (user_id, content, likes_count, created_at) VALUES (?, ?, ?, ?)`,
      ...p
    );
    postIds.push(result.lastInsertRowid);
  }

  // ──────────── COMMENTS ────────────
  const comments = [
    [postIds[0], userIds[1], '¡Felicidades María! Todo el esfuerzo valió la pena 🙌', '2026-04-15 10:45:00'],
    [postIds[0], userIds[2], 'Eres una inspiración! 🌟', '2026-04-15 11:00:00'],
    [postIds[1], userIds[0], 'Yo te puedo ayudar con algo de BD. Mandame DM!', '2026-04-15 09:30:00'],
    [postIds[2], userIds[3], 'Impresionante Ana! Qué framework usaste?', '2026-04-14 23:10:00'],
    [postIds[2], userIds[2], 'Gracias Roberto! Usé PyTorch con transfer learning 🔥', '2026-04-14 23:25:00'],
    [postIds[4], userIds[0], 'Valentina, la medicina es hermosa pero exigente. Si te apasiona, ve por ella! 💪', '2026-04-14 15:00:00'],
    [postIds[4], userIds[2], 'Te recomiendo investigar las mallas curriculares aquí en UniNetwork 📋', '2026-04-14 15:30:00'],
    [postIds[5], userIds[2], 'La UPB es increíble! Si tienes dudas escríbeme 😊', '2026-04-13 12:00:00'],
    [postIds[6], userIds[1], 'Tan cierto! El mejor profesor es el error jaja', '2026-04-13 08:30:00'],
    [postIds[7], userIds[0], 'Éxito Ana! Representanos bien 🇧🇴', '2026-04-12 20:00:00'],
  ];

  for (const c of comments) {
    db.run(
      `INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)`,
      ...c
    );
  }

  // ──────────── CONNECTIONS ────────────
  db.run(`INSERT INTO connections (requester_id, receiver_id, status) VALUES (?, ?, ?)`, userIds[0], userIds[1], 'accepted');
  db.run(`INSERT INTO connections (requester_id, receiver_id, status) VALUES (?, ?, ?)`, userIds[0], userIds[2], 'accepted');
  db.run(`INSERT INTO connections (requester_id, receiver_id, status) VALUES (?, ?, ?)`, userIds[1], userIds[3], 'accepted');
  db.run(`INSERT INTO connections (requester_id, receiver_id, status) VALUES (?, ?, ?)`, userIds[2], userIds[3], 'accepted');
  db.run(`INSERT INTO connections (requester_id, receiver_id, status) VALUES (?, ?, ?)`, userIds[4], userIds[0], 'accepted');
  db.run(`INSERT INTO connections (requester_id, receiver_id, status) VALUES (?, ?, ?)`, userIds[5], userIds[0], 'pending');
  db.run(`INSERT INTO connections (requester_id, receiver_id, status) VALUES (?, ?, ?)`, userIds[5], userIds[3], 'pending');

  // ──────────── LIKES ────────────
  db.run(`INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)`, userIds[1], postIds[0]);
  db.run(`INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)`, userIds[2], postIds[0]);
  db.run(`INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)`, userIds[0], postIds[2]);
  db.run(`INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)`, userIds[3], postIds[2]);
  db.run(`INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)`, userIds[0], postIds[4]);

  // ──────────── VOCATIONAL QUESTIONS (RIASEC × 8) ────────────
  const vocQuestions = [
    // R - Realista (práctico, técnico, mecánico)
    ['Me gusta trabajar con herramientas, máquinas o equipos', 'R', 1.0, 1],
    ['Prefiero actividades al aire libre o trabajo de campo', 'R', 1.0, 2],
    ['Disfruto armar, reparar o construir cosas con mis manos', 'R', 1.0, 3],
    ['Me interesan la mecánica, la electrónica o la tecnología aplicada', 'R', 1.0, 4],
    ['Me gusta el deporte y la actividad física', 'R', 0.8, 5],
    ['Prefiero las soluciones concretas y prácticas a las teóricas', 'R', 1.0, 6],
    ['Me siento cómodo/a trabajando con planos, mapas o modelos', 'R', 1.0, 7],
    ['Me atrae el trabajo de laboratorio o taller práctico', 'R', 0.8, 8],

    // I - Investigador (analítico, científico)
    ['Me gusta resolver problemas matemáticos o científicos', 'I', 1.0, 9],
    ['Disfruto investigar temas a profundidad y buscar explicaciones', 'I', 1.0, 10],
    ['Me atrae el análisis de datos y la estadística', 'I', 1.0, 11],
    ['Me interesa entender cómo funcionan las cosas a nivel fundamental', 'I', 1.0, 12],
    ['Me gusta la lectura de artículos científicos o documentales', 'I', 0.8, 13],
    ['Disfruto programar, crear algoritmos o resolver puzzles lógicos', 'I', 1.0, 14],
    ['Me interesa la biología, la química o la física', 'I', 1.0, 15],
    ['Prefiero tomar decisiones basadas en evidencia y datos', 'I', 0.8, 16],

    // A - Artístico (creativo, expresivo)
    ['Me gusta dibujar, pintar, diseñar o hacer fotografía', 'A', 1.0, 17],
    ['Disfruto la música, la actuación o la escritura creativa', 'A', 1.0, 18],
    ['Me atrae el diseño gráfico, la moda o la decoración', 'A', 1.0, 19],
    ['Valoro la originalidad y evito seguir reglas rígidas', 'A', 0.8, 20],
    ['Me gusta imaginar espacios, edificios o ciudades', 'A', 1.0, 21],
    ['Disfruto crear contenido visual, videos o presentaciones', 'A', 1.0, 22],
    ['Me interesa la cultura, el arte y la historia', 'A', 0.8, 23],
    ['Prefiero ambientes de trabajo flexibles y creativos', 'A', 0.8, 24],

    // S - Social (empático, servicio)
    ['Me gusta ayudar a otros a resolver sus problemas personales', 'S', 1.0, 25],
    ['Disfruto enseñar, explicar o dar tutorías', 'S', 1.0, 26],
    ['Me interesa el voluntariado y el trabajo comunitario', 'S', 0.8, 27],
    ['Soy bueno/a escuchando y comprendiendo a las personas', 'S', 1.0, 28],
    ['Me gustaría trabajar en salud, educación o servicios sociales', 'S', 1.0, 29],
    ['Me preocupo por la justicia social y los derechos humanos', 'S', 1.0, 30],
    ['Prefiero el trabajo en equipo al trabajo individual', 'S', 0.8, 31],
    ['Me motiva ver el impacto positivo de mi trabajo en otros', 'S', 0.8, 32],

    // E - Emprendedor (líder, persuasivo)
    ['Me gusta liderar grupos y tomar la iniciativa', 'E', 1.0, 33],
    ['Disfruto convencer, negociar o vender ideas', 'E', 1.0, 34],
    ['Me atrae el mundo de los negocios y el emprendimiento', 'E', 1.0, 35],
    ['Me gustaría tener mi propia empresa algún día', 'E', 1.0, 36],
    ['Soy competitivo/a y orientado/a a resultados', 'E', 0.8, 37],
    ['Me interesa la política, la gestión pública o el derecho empresarial', 'E', 0.8, 38],
    ['Me siento cómodo/a hablando en público o presentando ideas', 'E', 1.0, 39],
    ['Me gusta planificar proyectos y coordinar equipos', 'E', 0.8, 40],

    // C - Convencional (organizado, metódico)
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

  // ──────────── CAREER RIASEC VECTORS ────────────
  // Format: [career_id, R, I, A, S, E, C]
  const careerRiasec = [
    [careerIds[0],  0.3, 0.9, 0.2, 0.1, 0.3, 0.5], // Ing. Sistemas UMSA
    [careerIds[1],  0.4, 0.9, 0.1, 0.8, 0.2, 0.3], // Medicina
    [careerIds[2],  0.1, 0.5, 0.2, 0.7, 0.7, 0.5], // Derecho
    [careerIds[3],  0.1, 0.8, 0.1, 0.3, 0.6, 0.8], // Economía
    [careerIds[4],  0.6, 0.4, 0.9, 0.2, 0.3, 0.3], // Arquitectura
    [careerIds[5],  0.3, 0.9, 0.2, 0.1, 0.3, 0.5], // Ing. Sistemas UMSS
    [careerIds[6],  0.7, 0.6, 0.1, 0.2, 0.5, 0.6], // Ing. Industrial
    [careerIds[7],  0.1, 0.4, 0.1, 0.2, 0.4, 0.9], // Contaduría
    [careerIds[8],  0.3, 0.9, 0.2, 0.1, 0.3, 0.5], // Ing. Informática UAGRM
    [careerIds[9],  0.1, 0.3, 0.2, 0.4, 0.9, 0.6], // Admin Empresas UAGRM
    [careerIds[10], 0.9, 0.6, 0.3, 0.1, 0.3, 0.4], // Ing. Civil
    [careerIds[11], 0.3, 0.9, 0.2, 0.1, 0.3, 0.5], // Ing. Sistemas UPB
    [careerIds[12], 0.1, 0.3, 0.2, 0.4, 0.9, 0.6], // Admin Empresas UPB
    [careerIds[13], 0.1, 0.4, 0.2, 0.4, 0.9, 0.5], // Ing. Comercial
    [careerIds[14], 0.8, 0.7, 0.2, 0.1, 0.3, 0.4], // Ing. Telecom
    [careerIds[15], 0.1, 0.7, 0.4, 0.9, 0.3, 0.2], // Psicología
    [careerIds[16], 0.3, 0.9, 0.2, 0.1, 0.3, 0.5], // Ing. Sistemas UPSA
    [careerIds[17], 0.2, 0.2, 0.9, 0.3, 0.4, 0.2], // Diseño Gráfico
    [careerIds[18], 0.2, 0.9, 0.2, 0.1, 0.2, 0.4], // Cs. Computación UBA
    [careerIds[19], 0.4, 0.8, 0.1, 0.1, 0.2, 0.4], // Ing. Computación UNAM
    [careerIds[20], 0.4, 0.9, 0.2, 0.1, 0.2, 0.4], // Ing. Civil Comp PUC
    [careerIds[21], 0.3, 0.9, 0.2, 0.1, 0.3, 0.4], // CS MIT
  ];

  for (const cr of careerRiasec) {
    db.run('INSERT INTO career_riasec (career_id, r, i, a, s, e, c) VALUES (?, ?, ?, ?, ?, ?, ?)', ...cr);
  }

  saveDb();

  console.log('🌱 Seed data inserted successfully!');
  console.log(`   📚 ${universities.length} universities`);
  console.log(`   🎓 ${careers.length} careers`);
  console.log(`   👤 ${demoUsers.length} users`);
  console.log(`   📝 ${posts.length} posts`);
  console.log(`   💬 ${comments.length} comments`);
  console.log(`   🧭 ${vocQuestions.length} vocational questions`);
  console.log(`   🧬 ${careerRiasec.length} career RIASEC vectors`);
  console.log('\n🔑 Demo login: email: maria@uninetwork.bo | password: demo1234');

  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
