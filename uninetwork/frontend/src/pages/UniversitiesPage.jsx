import { useState, useEffect } from 'react';
import { universitiesApi } from '../services/api';
import './UniversitiesPage.css';

function UniCard({ uni, isExpanded, uniDetail, onToggle, icon = '🎓' }) {
  return (
    <div className={`uni-card card animate-fadeIn ${isExpanded ? 'expanded' : ''}`}
      onClick={onToggle}>
      <div className="uni-card-accent" />
      <div className="uni-card-header">
        <div className="uni-icon">{icon}</div>
        <div className="uni-header-text">
          <h3>{uni.name}</h3>
          <span className="uni-acronym">{uni.acronym}</span>
        </div>
      </div>
      <div className="uni-card-info">
        <span className="uni-location">📍 {uni.city}, {uni.country}</span>
        <span className={`badge ${uni.type === 'publica' ? 'badge-success' : 'badge-warning'}`}>
          {uni.type === 'publica' ? 'Pública' : 'Privada'}
        </span>
      </div>
      {uni.description && <p className="uni-description">{uni.description}</p>}

      {isExpanded && uniDetail && (
        <div className="uni-detail animate-fadeIn" onClick={e => e.stopPropagation()}>
          <div className="uni-stats">
            <div className="stat-item">
              <span className="stat-value">{uniDetail.careers?.length || 0}</span>
              <span className="stat-label">Carreras</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{uniDetail.studentCount || 0}</span>
              <span className="stat-label">En UniNet</span>
            </div>
          </div>
          {uniDetail.careers?.length > 0 && (
            <div className="uni-careers">
              <h4>📚 Carreras disponibles:</h4>
              {uniDetail.careers.map(c => (
                <div key={c.id} className="uni-career-item">
                  <div className="career-item-left">
                    <span className="career-dot" />
                    <span className="uni-career-name">{c.name}</span>
                  </div>
                  <span className="career-duration">{c.duration_years} años</span>
                </div>
              ))}
            </div>
          )}
          {uni.website && (
            <a href={uni.website} target="_blank" rel="noopener noreferrer"
              className="btn btn-primary btn-sm" style={{marginTop:14}}>
              🌐 Visitar sitio web
            </a>
          )}
        </div>
      )}
      <div className="uni-expand-hint">
        {isExpanded ? '▲ Cerrar' : '▼ Ver carreras'}
      </div>
    </div>
  );
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [uniDetail, setUniDetail] = useState(null);

  useEffect(() => { loadUniversities(); }, []);

  const loadUniversities = async () => {
    try {
      const data = await universitiesApi.getAll();
      setUniversities(data.universities);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadDetail = async (id) => {
    if (expanded === id) { setExpanded(null); setUniDetail(null); return; }
    try {
      const data = await universitiesApi.getById(id);
      setUniDetail(data);
      setExpanded(id);
    } catch (err) { console.error(err); }
  };

  const filterUnis = (list) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(u => u.name.toLowerCase().includes(q) || u.acronym?.toLowerCase().includes(q));
  };

  const bolivian = universities.filter(u => u.country === 'Bolivia');
  const international = universities.filter(u => u.country !== 'Bolivia');
  const displayBolivian = filter === 'all' || filter === 'bolivia' ? filterUnis(bolivian) : [];
  const displayIntl = filter === 'all' || filter === 'international' ? filterUnis(international) : [];

  if (loading) return <div className="loader-container"><div className="spinner" /></div>;

  return (
    <div className="universities-page">
      {/* Hero */}
      <div className="uni-hero-section">
        <div className="uni-hero-bg">
          <img src="/images/hero-bg.png" alt="" className="uni-hero-img" />
          <div className="uni-hero-overlay" />
        </div>
        <div className="container uni-hero-content animate-fadeIn">
          <div className="uni-hero-badge">🏛️ Directorio Completo</div>
          <h1>Universidades</h1>
          <p>Explora {universities.length} universidades de Bolivia y del mundo</p>

          <div className="uni-hero-stats">
            <div className="uni-hero-stat">
              <span className="stat-number">{bolivian.length}</span>
              <span className="stat-text">Bolivianas</span>
            </div>
            <div className="uni-hero-stat-divider" />
            <div className="uni-hero-stat">
              <span className="stat-number">{international.length}</span>
              <span className="stat-text">Extranjeras</span>
            </div>
            <div className="uni-hero-stat-divider" />
            <div className="uni-hero-stat">
              <span className="stat-number">{universities.length}</span>
              <span className="stat-text">Total</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Controls */}
        <div className="uni-controls animate-fadeIn">
          <div className="uni-search-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input className="uni-search-input" placeholder="Buscar universidad por nombre o sigla..."
              value={search} onChange={e => setSearch(e.target.value)} id="uni-search" />
          </div>
          <div className="uni-tabs">
            {[
              { key: 'all', label: '🌍 Todas', count: universities.length },
              { key: 'bolivia', label: '🇧🇴 Bolivia', count: bolivian.length },
              { key: 'international', label: '✈️ Extranjeras', count: international.length },
            ].map(t => (
              <button key={t.key} className={`tab ${filter === t.key ? 'active' : ''}`}
                onClick={() => setFilter(t.key)}>
                {t.label} <span className="tab-count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bolivia Section */}
        {displayBolivian.length > 0 && (
          <section className="uni-section animate-fadeIn">
            <h2 className="section-title">
              <span className="section-flag">🇧🇴</span>
              Universidades de Bolivia
              <span className="section-count">{displayBolivian.length}</span>
            </h2>
            <div className="uni-grid">
              {displayBolivian.map((uni, i) => (
                <UniCard key={uni.id} uni={uni} icon="🎓"
                  isExpanded={expanded === uni.id} uniDetail={uniDetail}
                  onToggle={() => loadDetail(uni.id)} />
              ))}
            </div>
          </section>
        )}

        {/* International Section */}
        {displayIntl.length > 0 && (
          <section className="uni-section animate-fadeIn">
            <h2 className="section-title">
              <span className="section-flag">✈️</span>
              Universidades Extranjeras
              <span className="section-count">{displayIntl.length}</span>
            </h2>
            <div className="uni-grid">
              {displayIntl.map((uni, i) => (
                <UniCard key={uni.id} uni={uni} icon="🌍"
                  isExpanded={expanded === uni.id} uniDetail={uniDetail}
                  onToggle={() => loadDetail(uni.id)} />
              ))}
            </div>
          </section>
        )}

        {displayBolivian.length === 0 && displayIntl.length === 0 && (
          <div className="empty-state animate-fadeIn">
            <div className="empty-icon">🏛️</div>
            <h3>No se encontraron universidades</h3>
            <p>Intenta con otro término de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
}
