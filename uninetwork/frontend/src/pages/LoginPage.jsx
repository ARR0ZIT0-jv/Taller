import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('maria@uninetwork.bo');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
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
        <div className="auth-orb auth-orb-3" />
        <div className="auth-grid-pattern" />
      </div>

      <div className="auth-split">
        {/* Left: Hero */}
        <div className="auth-hero hide-mobile">
          <div className="auth-hero-content">
            <div className="hero-badge">🎓 Red Social Universitaria</div>
            <h2>Conecta con tu comunidad académica</h2>
            <p>Descubre carreras, universidades y conecta con estudiantes de toda Bolivia y el mundo.</p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-value">15+</span>
                <span className="hero-stat-label">Universidades</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">22+</span>
                <span className="hero-stat-label">Carreras</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">100%</span>
                <span className="hero-stat-label">Gratuito</span>
              </div>
            </div>
            <div className="hero-avatars">
              <img src="/images/avatar-maria.png" alt="" className="hero-avatar-img" />
              <img src="/images/avatar-carlos.png" alt="" className="hero-avatar-img" style={{marginLeft:'-12px'}} />
              <img src="/images/avatar-ana.png" alt="" className="hero-avatar-img" style={{marginLeft:'-12px'}} />
              <img src="/images/avatar-roberto.png" alt="" className="hero-avatar-img" style={{marginLeft:'-12px'}} />
              <span className="hero-avatar-text">+200 estudiantes ya se unieron</span>
            </div>
          </div>
          <img src="/images/hero-bg.png" className="hero-bg-img" alt="" />
        </div>

        {/* Right: Form */}
        <div className="auth-form-side">
          <div className="auth-container animate-scaleIn">
            <div className="auth-header">
              <span className="auth-logo">🎓</span>
              <h1>Uni<span className="brand-highlight">Network</span></h1>
              <p className="auth-subtitle">Bienvenido de vuelta</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} id="login-form">
              {error && <div className="alert alert-error">{error}</div>}

              <div className="input-group">
                <label htmlFor="email">Correo electrónico</label>
                <input id="email" type="email" className="input" placeholder="tu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="input-group">
                <label htmlFor="password">Contraseña</label>
                <input id="password" type="password" className="input" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} id="btn-login">
                {loading ? <div className="spinner" style={{width:20,height:20,borderWidth:2}} /> : '→ Iniciar Sesión'}
              </button>
            </form>

            <div className="auth-footer">
              <p>¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></p>
            </div>

            <div className="auth-demo-info">
              <div className="demo-label">🔑 Acceso Demo</div>
              <code>maria@uninetwork.bo</code> / <code>demo1234</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
