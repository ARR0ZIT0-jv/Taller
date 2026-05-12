import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner container">
        <NavLink to="/feed" className="navbar-brand">
          <span className="brand-icon">🎓</span>
          <span className="brand-text">Uni<span className="brand-highlight">Network</span></span>
        </NavLink>
        
        <div className="navbar-links">
          <NavLink to="/feed" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} id="nav-feed">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
            <span>Inicio</span>
          </NavLink>
          <NavLink to="/search" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} id="nav-search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <span>Carreras</span>
          </NavLink>
          <NavLink to="/vocational" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} id="nav-vocational">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            <span>Test Vocacional</span>
          </NavLink>
          <NavLink to="/universities" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} id="nav-universities">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/></svg>
            <span>Universidades</span>
          </NavLink>
        </div>

        <div className="navbar-user">
          <NavLink to={user ? `/profile/${user.id}` : '#'} className="nav-profile-link" id="nav-profile">
            <div className="avatar nav-avatar">
              {user?.profile_pic 
                ? <img src={user.profile_pic} alt={user.full_name} />
                : getInitials(user?.full_name)
              }
            </div>
            <span className="nav-username hide-mobile">{user?.full_name?.split(' ')[0]}</span>
          </NavLink>
          <button onClick={handleLogout} className="btn-ghost nav-logout" id="btn-logout" title="Cerrar sesión">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
