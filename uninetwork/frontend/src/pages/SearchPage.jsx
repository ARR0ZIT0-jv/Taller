import { useState, useEffect } from 'react';
import { careersApi } from '../services/api';
import './SearchPage.css';

const DURATION_COLORS = {
  4: '#10b981',
  5: '#6366f1',
  6: '#f59e0b',
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [type, setType] = useState('');
  const [faculty, setFaculty] = useState('');
  const [results, setResults] = useState([]);
  const [countries, setCountries] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [expanded, setExpanded] = useState(null);

  // Simple search function that takes explicit params to avoid stale closure issues
  async function doSearch(searchQuery, searchCountry, searchType, searchFaculty) {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.query = searchQuery;
      if (searchCountry) params.country = searchCountry;
      if (searchType) params.type = searchType;
      if (searchFaculty) params.faculty = searchFaculty;
      const data = await careersApi.search(params);
      setResults(data.results || []);
      setPagination(data.pagination || {});
    } catch (err) { console.error(err); setResults([]); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    // Load filter options
    careersApi.getCountries().then(d => setCountries(d.countries || [])).catch(() => {});
    careersApi.getFaculties().then(d => setFaculties(d.faculties || [])).catch(() => {});
    // Load all careers initially
    doSearch('', '', '', '');
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch(query, country, type, faculty);
  };

  const handleFilterChange = (field, value) => {
    const setters = { country: setCountry, type: setType, faculty: setFaculty };
    setters[field](value);
    // Pass current values with the override
    const c = field === 'country' ? value : country;
    const t = field === 'type' ? value : type;
    const f = field === 'faculty' ? value : faculty;
    doSearch(query, c, t, f);
  };

  const clearFilters = () => {
    setQuery(''); setCountry(''); setType(''); setFaculty('');
    doSearch('', '', '', '');
  };

  return (
    <div className="search-page">
      {/* Hero Section */}
      <div className="search-hero-section">
        <div className="search-hero-bg">
          <img src="/images/hero-bg.png" alt="" className="search-hero-img" />
          <div className="search-hero-overlay" />
        </div>
        <div className="container search-hero-content animate-fadeIn">
          <div className="search-hero-badge">🔍 Motor de Búsqueda Inteligente</div>
          <h1>Encuentra tu carrera ideal</h1>
          <p>Explora más de {pagination.total || 22} carreras en universidades de Bolivia y el mundo</p>

          <form className="search-main-bar" onSubmit={handleSubmit} id="career-search-form">
            <div className="search-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            <input className="search-main-input" placeholder="Ingeniería de Sistemas, Medicina, Derecho, IA..."
              value={query} onChange={e => setQuery(e.target.value)} id="search-query" />
            <button type="submit" className="btn btn-primary btn-lg search-submit-btn" id="btn-search">
              Buscar Carreras
            </button>
          </form>

          <div className="search-quick-tags">
            <span className="quick-label">Populares:</span>
            {['Ingeniería de Sistemas', 'Medicina', 'Derecho', 'Administración'].map(t => (
              <button key={t} className="quick-tag" onClick={() => { setQuery(t); doSearch(t, country, type, faculty); }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="container search-body">
        {/* Filters */}
        <div className="search-filters animate-fadeIn">
          <div className="filter-group">
            <label>🌍 País</label>
            <select className="input filter-select" value={country}
              onChange={e => handleFilterChange('country', e.target.value)} id="filter-country">
              <option value="">Todos los países</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>🏛️ Tipo</label>
            <select className="input filter-select" value={type}
              onChange={e => handleFilterChange('type', e.target.value)} id="filter-type">
              <option value="">Todas</option>
              <option value="publica">Pública</option>
              <option value="privada">Privada</option>
            </select>
          </div>
          <div className="filter-group">
            <label>📚 Facultad</label>
            <select className="input filter-select" value={faculty}
              onChange={e => handleFilterChange('faculty', e.target.value)} id="filter-faculty">
              <option value="">Todas las facultades</option>
              {faculties.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="filter-group filter-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Limpiar</button>
          </div>
        </div>

        {/* Results Header */}
        <div className="results-header animate-fadeIn">
          <h2>{pagination.total || 0} carreras encontradas</h2>
          {(query || country || type || faculty) && (
            <div className="active-filters">
              {query && <span className="filter-chip" onClick={() => { setQuery(''); doSearch('', country, type, faculty); }}>"{query}" ✕</span>}
              {country && <span className="filter-chip" onClick={() => handleFilterChange('country', '')}>{country} ✕</span>}
              {type && <span className="filter-chip" onClick={() => handleFilterChange('type', '')}>{type} ✕</span>}
              {faculty && <span className="filter-chip" onClick={() => handleFilterChange('faculty', '')}>{faculty} ✕</span>}
            </div>
          )}
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="loader-container"><div className="spinner" /></div>
        ) : results.length === 0 ? (
          <div className="empty-state animate-fadeIn">
            <div className="empty-icon">🎓</div>
            <h3>No se encontraron carreras</h3>
            <p>Intenta con otros filtros o términos de búsqueda</p>
            <button className="btn btn-secondary" onClick={clearFilters}>Ver todas las carreras</button>
          </div>
        ) : (
          <div className="career-grid">
            {results.map((career, i) => (
              <div key={career.id} className={`career-card card animate-fadeIn ${expanded === career.id ? 'expanded' : ''}`}
                style={{animationDelay: `${i * 0.04}s`}}
                onClick={() => setExpanded(expanded === career.id ? null : career.id)}>
                
                <div className="career-card-accent" style={{background: `linear-gradient(90deg, ${DURATION_COLORS[career.duration_years] || '#6366f1'}, transparent)`}} />
                
                <div className="career-card-top">
                  <div className="career-uni-row">
                    <div className="career-uni-icon">🏛️</div>
                    <div className="career-uni-info">
                      <span className="career-uni-name">{career.university_acronym}</span>
                      <span className="career-uni-full">{career.university_name}</span>
                    </div>
                    <span className={`badge ${career.university_type === 'publica' ? 'badge-success' : 'badge-warning'}`}>
                      {career.university_type === 'publica' ? 'Pública' : 'Privada'}
                    </span>
                  </div>
                  <h3 className="career-name">{career.name}</h3>
                  <p className="career-faculty">{career.faculty}</p>
                </div>

                <div className="career-card-details">
                  <div className="detail-chip">
                    <span className="detail-icon">⏱️</span>
                    <span>{career.duration_years} años</span>
                  </div>
                  <div className="detail-chip">
                    <span className="detail-icon">📍</span>
                    <span>{career.city}, {career.country}</span>
                  </div>
                </div>

                {career.degree_title && (
                  <div className="career-degree">
                    🎓 <strong>{career.degree_title}</strong>
                  </div>
                )}

                {expanded === career.id && (
                  <div className="career-expanded animate-fadeIn" onClick={e => e.stopPropagation()}>
                    {career.curriculum_summary && (
                      <div className="curriculum-section">
                        <h4>📋 Malla Curricular</h4>
                        <div className="curriculum-tags">
                          {career.curriculum_summary.split(',').map((item, j) => (
                            <span key={j} className="curriculum-tag">{item.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="career-actions">
                      {career.website && (
                        <a href={career.website} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                          🌐 Visitar sitio web
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="career-expand-hint">
                  {expanded === career.id ? '▲ Cerrar detalle' : '▼ Ver malla curricular'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
