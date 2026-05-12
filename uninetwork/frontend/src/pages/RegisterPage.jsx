import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { universitiesApi, careersApi } from '../services/api';
import './AuthPages.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', ci: '', ci_country: 'Bolivia',
    academic_status: 'university', university_id: '', career_id: '',
    interests: '', graduation_year: 2026
  });
  const [universities, setUniversities] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    universitiesApi.getAll().then(d => setUniversities(d.universities)).catch(() => {});
  }, []);

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        ...form,
        university_id: form.university_id ? parseInt(form.university_id) : null,
        career_id: form.career_id ? parseInt(form.career_id) : null,
        graduation_year: parseInt(form.graduation_year)
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-container auth-container-wide animate-scaleIn">
        <div className="auth-header">
          <span className="auth-logo">🎓</span>
          <h1>Únete a Uni<span className="brand-highlight">Network</span></h1>
          <p className="auth-subtitle">Conecta con estudiantes de toda Bolivia y el mundo</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} id="register-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-row">
            <div className="input-group">
              <label htmlFor="reg-name">Nombre completo</label>
              <input id="reg-name" className="input" placeholder="Juan Pérez López"
                value={form.full_name} onChange={update('full_name')} required />
            </div>
            <div className="input-group">
              <label htmlFor="reg-email">Correo electrónico</label>
              <input id="reg-email" type="email" className="input" placeholder="tu@email.com"
                value={form.email} onChange={update('email')} required />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label htmlFor="reg-ci">Cédula de Identidad (C.I.)</label>
              <input id="reg-ci" className="input" placeholder="1234567"
                value={form.ci} onChange={update('ci')} required />
            </div>
            <div className="input-group">
              <label htmlFor="reg-ci-country">País de la C.I.</label>
              <select id="reg-ci-country" className="input" value={form.ci_country} onChange={update('ci_country')}>
                <option value="Bolivia">Bolivia</option>
                <option value="Argentina">Argentina</option>
                <option value="Peru">Perú</option>
                <option value="Colombia">Colombia</option>
                <option value="Chile">Chile</option>
                <option value="Brasil">Brasil</option>
                <option value="Mexico">México</option>
                <option value="Generic">Otro país</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label htmlFor="reg-password">Contraseña (mín. 6 caracteres)</label>
              <input id="reg-password" type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={update('password')} required minLength={6} />
            </div>
            <div className="input-group">
              <label htmlFor="reg-status">Estatus académico</label>
              <select id="reg-status" className="input" value={form.academic_status} onChange={update('academic_status')}>
                <option value="university">Estudiante universitario</option>
                <option value="high_school">Bachiller / Promoción</option>
              </select>
            </div>
          </div>

          {form.academic_status === 'university' && (
            <div className="input-group animate-fadeIn">
              <label htmlFor="reg-university">Universidad (Alma Mater)</label>
              <select id="reg-university" className="input" value={form.university_id} onChange={update('university_id')} required>
                <option value="">Selecciona tu universidad...</option>
                {universities.map(u => <option key={u.id} value={u.id}>{u.name} ({u.acronym})</option>)}
              </select>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="reg-interests">Intereses académicos (separados por coma)</label>
            <input id="reg-interests" className="input" placeholder="IA, Medicina, Ingeniería, etc."
              value={form.interests} onChange={update('interests')} />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} id="btn-register">
            {loading ? <div className="spinner" style={{width:20,height:20, borderWidth:2}} /> : 'Crear mi cuenta'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </div>
      </div>
    </div>
  );
}
