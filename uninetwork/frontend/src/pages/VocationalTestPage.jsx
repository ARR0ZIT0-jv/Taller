import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vocationalApi } from '../services/api';
import './VocationalTestPage.css';

const LIKERT_OPTIONS = [
  { value: 1, label: 'Nada', emoji: '😐' },
  { value: 2, label: 'Poco', emoji: '🤔' },
  { value: 3, label: 'Algo', emoji: '😊' },
  { value: 4, label: 'Bastante', emoji: '👍' },
  { value: 5, label: 'Totalmente', emoji: '🔥' },
];

const CATEGORY_EMOJIS = { R: '🔧', I: '🔬', A: '🎨', S: '🤝', E: '🚀', C: '📊' };
const CATEGORY_COLORS = {
  R: '#ef4444', I: '#6366f1', A: '#f59e0b',
  S: '#10b981', E: '#f97316', C: '#06b6d4',
};

function RadarChart({ scores, size = 280 }) {
  const cats = ['R', 'I', 'A', 'S', 'E', 'C'];
  const labels = { R: 'Realista', I: 'Investigador', A: 'Artístico', S: 'Social', E: 'Emprendedor', C: 'Convencional' };
  const cx = size / 2, cy = size / 2, maxR = size / 2 - 40;

  const getPoint = (idx, value) => {
    const angle = (Math.PI * 2 * idx) / 6 - Math.PI / 2;
    const r = (value / 100) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const levels = [20, 40, 60, 80, 100];
  const dataPoints = cats.map((c, i) => getPoint(i, scores[c] || 0));
  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="radar-chart">
      {/* Grid levels */}
      {levels.map(level => {
        const pts = cats.map((_, i) => getPoint(i, level));
        return <polygon key={level} points={pts.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
      })}
      {/* Axes */}
      {cats.map((_, i) => {
        const end = getPoint(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
          stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
      })}
      {/* Data polygon */}
      <polygon points={polygon} fill="url(#radarGrad)" stroke="var(--accent)" strokeWidth="2.5"
        className="radar-polygon" />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5"
          fill={CATEGORY_COLORS[cats[i]]} stroke="var(--bg-primary)" strokeWidth="2"
          className="radar-dot" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
      {/* Labels */}
      {cats.map((c, i) => {
        const pt = getPoint(i, 125);
        return (
          <text key={c} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central"
            className="radar-label" fill={CATEGORY_COLORS[c]} fontSize="11" fontWeight="700">
            {CATEGORY_EMOJIS[c]} {labels[c]}
          </text>
        );
      })}
      {/* Score values */}
      {cats.map((c, i) => {
        const pt = getPoint(i, scores[c] > 50 ? scores[c] - 15 : scores[c] + 18);
        return (
          <text key={`v-${c}`} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central"
            fill="white" fontSize="12" fontWeight="800" opacity="0.9">
            {scores[c]}%
          </text>
        );
      })}
      <defs>
        <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(6,182,212,0.3)" />
          <stop offset="100%" stopColor="rgba(124,58,237,0.3)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── INTRO PHASE ───
function IntroPhase({ onStart, hasHistory, onViewHistory }) {
  return (
    <div className="voc-intro animate-fadeIn">
      <div className="voc-hero-section">
        <div className="voc-hero-glow" />
        <div className="container">
          <div className="voc-hero-badge">🧭 Test de Orientación Vocacional</div>
          <h1 className="voc-hero-title">Descubre tu carrera ideal</h1>
          <p className="voc-hero-subtitle">
            Responde 48 preguntas basadas en el modelo RIASEC de Holland y obtén
            recomendaciones personalizadas para tu futuro profesional.
          </p>
          <div className="voc-hero-features">
            <div className="voc-feature">
              <span className="voc-feature-icon">⏱️</span>
              <span>10-15 min</span>
            </div>
            <div className="voc-feature">
              <span className="voc-feature-icon">📊</span>
              <span>6 dimensiones</span>
            </div>
            <div className="voc-feature">
              <span className="voc-feature-icon">🎯</span>
              <span>Top 5 carreras</span>
            </div>
          </div>
          <div className="voc-hero-actions">
            <button className="btn btn-primary btn-lg voc-start-btn" onClick={onStart}>
              🚀 Comenzar Test
            </button>
            {hasHistory && (
              <button className="btn btn-ghost btn-lg" onClick={onViewHistory}>
                📋 Ver mis resultados anteriores
              </button>
            )}
          </div>

          <div className="voc-riasec-preview">
            <h3>Las 6 Dimensiones RIASEC</h3>
            <div className="voc-dim-grid">
              {Object.entries(CATEGORY_EMOJIS).map(([code, emoji]) => (
                <div key={code} className="voc-dim-card" style={{ borderColor: CATEGORY_COLORS[code] }}>
                  <span className="voc-dim-emoji">{emoji}</span>
                  <span className="voc-dim-code" style={{ color: CATEGORY_COLORS[code] }}>{code}</span>
                  <span className="voc-dim-name">{
                    { R:'Realista', I:'Investigador', A:'Artístico', S:'Social', E:'Emprendedor', C:'Convencional' }[code]
                  }</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── QUESTION PHASE ───
function QuestionPhase({ questions, answers, setAnswers, onSubmit, loading }) {
  const QUESTIONS_PER_PAGE = 6;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const currentQ = questions.slice(page * QUESTIONS_PER_PAGE, (page + 1) * QUESTIONS_PER_PAGE);
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / questions.length) * 100);

  const canNext = currentQ.every(q => answers[q.id] !== undefined);
  const isLastPage = page === totalPages - 1;

  return (
    <div className="voc-questions animate-fadeIn">
      <div className="container">
        {/* Progress */}
        <div className="voc-progress-section">
          <div className="voc-progress-info">
            <span className="voc-progress-label">Progreso</span>
            <span className="voc-progress-count">{answered} / {questions.length}</span>
          </div>
          <div className="voc-progress-bar">
            <div className="voc-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="voc-page-indicator">
            Página {page + 1} de {totalPages}
          </div>
        </div>

        {/* Category Badge */}
        {currentQ[0] && (
          <div className="voc-category-badge" style={{
            background: `${CATEGORY_COLORS[currentQ[0].category]}18`,
            borderColor: `${CATEGORY_COLORS[currentQ[0].category]}40`,
            color: CATEGORY_COLORS[currentQ[0].category],
          }}>
            {CATEGORY_EMOJIS[currentQ[0].category]} Dimensión: {
              { R:'Realista', I:'Investigador', A:'Artístico', S:'Social', E:'Emprendedor', C:'Convencional' }[currentQ[0].category]
            }
          </div>
        )}

        {/* Questions */}
        <div className="voc-questions-grid">
          {currentQ.map((q, idx) => (
            <div key={q.id} className={`voc-question-card card animate-fadeIn ${answers[q.id] ? 'answered' : ''}`}
              style={{ animationDelay: `${idx * 0.08}s` }}>
              <div className="voc-q-number">{q.order_num}</div>
              <p className="voc-q-text">{q.text}</p>
              <div className="voc-likert">
                {LIKERT_OPTIONS.map(opt => (
                  <button key={opt.value}
                    className={`voc-likert-btn ${answers[q.id] === opt.value ? 'selected' : ''}`}
                    style={answers[q.id] === opt.value ? {
                      background: `${CATEGORY_COLORS[q.category]}28`,
                      borderColor: CATEGORY_COLORS[q.category],
                      color: CATEGORY_COLORS[q.category],
                    } : {}}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.value }))}>
                    <span className="likert-emoji">{opt.emoji}</span>
                    <span className="likert-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="voc-nav-buttons">
          <button className="btn btn-ghost" disabled={page === 0}
            onClick={() => setPage(p => p - 1)}>
            ← Anterior
          </button>
          {isLastPage ? (
            <button className="btn btn-primary btn-lg voc-submit-btn"
              disabled={answered < questions.length || loading}
              onClick={onSubmit}>
              {loading ? '⏳ Calculando...' : '🎯 Ver Resultados'}
            </button>
          ) : (
            <button className="btn btn-primary" disabled={!canNext}
              onClick={() => setPage(p => p + 1)}>
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RESULTS PHASE ───
function ResultsPhase({ result, onRetake }) {
  const navigate = useNavigate();
  const { scores, profileLabel, topCareers } = result;

  const sortedCats = ['R', 'I', 'A', 'S', 'E', 'C']
    .map(c => ({ code: c, score: scores[c] }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="voc-results animate-fadeIn">
      <div className="container">
        {/* Header */}
        <div className="voc-results-hero">
          <div className="voc-results-badge">🎯 Resultado del Test</div>
          <h1 className="voc-results-title">
            Tu Perfil: <span className="voc-profile-label">{profileLabel}</span>
          </h1>
          <p className="voc-results-subtitle">
            Basado en el modelo RIASEC de Holland, tu perfil vocacional tiene mayor afinidad con
            las dimensiones <strong style={{ color: CATEGORY_COLORS[sortedCats[0].code] }}>
              {CATEGORY_EMOJIS[sortedCats[0].code]} {
                { R:'Realista', I:'Investigador', A:'Artístico', S:'Social', E:'Emprendedor', C:'Convencional' }[sortedCats[0].code]
              }
            </strong> y <strong style={{ color: CATEGORY_COLORS[sortedCats[1].code] }}>
              {CATEGORY_EMOJIS[sortedCats[1].code]} {
                { R:'Realista', I:'Investigador', A:'Artístico', S:'Social', E:'Emprendedor', C:'Convencional' }[sortedCats[1].code]
              }
            </strong>.
          </p>
        </div>

        {/* Radar + Scores */}
        <div className="voc-results-grid">
          <div className="voc-radar-card card card-glass">
            <h3>📊 Gráfico RIASEC</h3>
            <RadarChart scores={scores} />
          </div>

          <div className="voc-scores-card card card-glass">
            <h3>📈 Puntuaciones por Dimensión</h3>
            <div className="voc-score-bars">
              {sortedCats.map(({ code, score }) => (
                <div key={code} className="voc-score-row">
                  <div className="voc-score-info">
                    <span className="voc-score-emoji">{CATEGORY_EMOJIS[code]}</span>
                    <span className="voc-score-name">{
                      { R:'Realista', I:'Investigador', A:'Artístico', S:'Social', E:'Emprendedor', C:'Convencional' }[code]
                    }</span>
                    <span className="voc-score-value" style={{ color: CATEGORY_COLORS[code] }}>{score}%</span>
                  </div>
                  <div className="voc-bar-track">
                    <div className="voc-bar-fill" style={{
                      width: `${score}%`,
                      background: CATEGORY_COLORS[code],
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Career Recommendations */}
        <div className="voc-careers-section">
          <h2>🎓 Top 5 Carreras Recomendadas</h2>
          <p className="voc-careers-subtitle">Basadas en tu perfil vocacional y el coseno de similitud con cada carrera</p>
          <div className="voc-career-grid">
            {topCareers.map((career, i) => (
              <div key={career.career_id} className="voc-career-card card animate-fadeIn"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="voc-career-rank">#{i + 1}</div>
                <div className="voc-career-match">{career.similarity}% match</div>
                <h3 className="voc-career-name">{career.career_name}</h3>
                <p className="voc-career-faculty">{career.faculty}</p>
                <div className="voc-career-meta">
                  <span>🏛️ {career.university_acronym}</span>
                  <span>📍 {career.city}, {career.country}</span>
                  <span>⏱️ {career.duration_years} años</span>
                </div>
                <button className="btn btn-primary btn-sm voc-career-btn"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(career.career_name)}`)}>
                  🔍 Ver en buscador
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="voc-results-actions">
          <button className="btn btn-ghost btn-lg" onClick={onRetake}>
            🔄 Repetir Test
          </button>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/search')}>
            🔍 Explorar Todas las Carreras
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───
export default function VocationalTestPage() {
  const [phase, setPhase] = useState('intro'); // intro | test | loading | results
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [hasHistory, setHasHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    vocationalApi.getLatest().then(data => {
      if (data.result) setHasHistory(true);
    }).catch(() => {});
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      const data = await vocationalApi.getQuestions();
      setQuestions(data.questions || []);
      setAnswers({});
      setPhase('test');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setPhase('loading');
    try {
      const answerArray = Object.entries(answers).map(([qId, answer]) => ({
        questionId: parseInt(qId),
        answer,
      }));
      const data = await vocationalApi.submit(answerArray);
      setResult(data);
      setPhase('results');
    } catch (err) {
      console.error(err);
      setPhase('test');
    }
    finally { setLoading(false); }
  };

  const handleViewHistory = async () => {
    setLoading(true);
    try {
      const data = await vocationalApi.getLatest();
      if (data.result) {
        setResult({
          scores: data.result.scores,
          profileLabel: data.result.profile_label,
          topCareers: data.topCareers || [],
        });
        setPhase('results');
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (phase === 'loading') {
    return (
      <div className="voc-loading-screen">
        <div className="voc-loading-content animate-fadeIn">
          <div className="voc-loading-spinner" />
          <h2>Analizando tus respuestas...</h2>
          <p>Calculando tu perfil RIASEC y buscando carreras afines</p>
        </div>
      </div>
    );
  }

  if (phase === 'results' && result) {
    return <ResultsPhase result={result} onRetake={() => setPhase('intro')} />;
  }

  if (phase === 'test') {
    return (
      <QuestionPhase
        questions={questions}
        answers={answers}
        setAnswers={setAnswers}
        onSubmit={handleSubmit}
        loading={loading}
      />
    );
  }

  return (
    <IntroPhase
      onStart={handleStart}
      hasHistory={hasHistory}
      onViewHistory={handleViewHistory}
    />
  );
}
