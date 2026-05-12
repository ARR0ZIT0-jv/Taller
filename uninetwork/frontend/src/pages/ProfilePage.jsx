import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileApi, postsApi } from '../services/api';
import './ProfilePage.css';

function getInitials(name) {
  return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
}

function Avatar({ src, name, size, className, style }) {
  const s = size || 42;
  if (src) {
    return (
      <div className={`avatar ${className || ''}`} style={{ width: s, height: s, ...style }}>
        <img src={src} alt={name} />
      </div>
    );
  }
  return (
    <div className={`avatar ${className || ''}`} style={{ width: s, height: s, fontSize: s * 0.32, ...style }}>
      {getInitials(name)}
    </div>
  );
}

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [connectionCount, setConnectionCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');

  const isOwnProfile = parseInt(userId) === currentUser?.id;

  useEffect(() => { loadProfile(); }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await profileApi.get(userId);
      setProfile(data.user);
      setPosts(data.posts || []);
      setConnectionCount(data.connectionCount || 0);
      setConnectionStatus(data.connectionStatus);
      setNewBio(data.user.bio || '');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleConnect = async () => {
    try { await profileApi.connect(userId); setConnectionStatus('pending'); } catch (err) { console.error(err); }
  };
  const handleSaveBio = async () => {
    try {
      await profileApi.update({ bio: newBio });
      setProfile(prev => ({ ...prev, bio: newBio }));
      setEditingBio(false);
    } catch (err) { console.error(err); }
  };
  const handleLike = async (postId) => {
    try {
      const data = await postsApi.toggleLike(postId);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, liked_by_me: data.liked ? 1 : 0, like_count: data.likeCount } : p
      ));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="loader-container"><div className="spinner" /></div>;
  if (!profile) return <div className="container text-center" style={{paddingTop:60}}><h2>Usuario no encontrado</h2></div>;

  return (
    <div className="profile-page">
      {/* Cover */}
      <div className="profile-cover animate-fadeIn">
        <img src="/images/hero-bg.png" alt="" className="cover-image" />
        <div className="cover-overlay" />
        <div className="container">
          <div className="profile-header-content">
            <div className="profile-avatar-section">
              <Avatar src={profile.profile_pic} name={profile.full_name} size={130} className="avatar-xl" />
              <div className="profile-header-info">
                <h1>{profile.full_name}</h1>
                <div className="profile-badges">
                  {profile.university_name && <span className="badge badge-primary">🎓 {profile.university_name}</span>}
                  {profile.career_name && <span className="badge badge-accent">📚 {profile.career_name}</span>}
                  {profile.academic_status === 'high_school' && <span className="badge badge-warning">🎒 Bachiller / Promoción</span>}
                </div>
                <div className="profile-stats-row">
                  <div className="profile-stat"><strong>{posts.length}</strong> publicaciones</div>
                  <div className="profile-stat"><strong>{connectionCount}</strong> conexiones</div>
                </div>
              </div>
            </div>
            <div className="profile-header-actions">
              {isOwnProfile ? (
                <button className="btn btn-secondary" onClick={() => setEditingBio(!editingBio)}>✏️ Editar perfil</button>
              ) : connectionStatus === 'accepted' ? (
                <span className="btn btn-secondary" style={{cursor:'default'}}>✅ Conectados</span>
              ) : connectionStatus === 'pending' ? (
                <span className="btn btn-secondary" style={{cursor:'default'}}>⏳ Solicitud enviada</span>
              ) : (
                <button className="btn btn-primary" onClick={handleConnect}>➕ Conectar</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container profile-body">
        <div className="profile-layout">
          {/* Sidebar */}
          <aside className="profile-sidebar">
            <div className="card">
              <h4>📝 Acerca de</h4>
              {editingBio ? (
                <div className="edit-bio animate-fadeIn">
                  <textarea className="input" value={newBio} onChange={e => setNewBio(e.target.value)}
                    placeholder="Cuéntanos sobre ti..." rows={3} />
                  <div className="flex gap-sm" style={{marginTop:8}}>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveBio}>Guardar</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingBio(false)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <p className="profile-bio">{profile.bio || 'Sin biografía aún.'}</p>
              )}
            </div>

            <div className="card">
              <h4>ℹ️ Información</h4>
              <div className="info-list">
                {profile.university_name && (
                  <div className="info-item">
                    <span className="info-icon">🎓</span>
                    <span>{profile.university_name}</span>
                  </div>
                )}
                {profile.career_name && (
                  <div className="info-item">
                    <span className="info-icon">📚</span>
                    <span>{profile.career_name}</span>
                  </div>
                )}
                {profile.faculty && (
                  <div className="info-item">
                    <span className="info-icon">🏛️</span>
                    <span>{profile.faculty}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-icon">👥</span>
                  <span>{connectionCount} conexiones</span>
                </div>
                {profile.graduation_year && (
                  <div className="info-item">
                    <span className="info-icon">📅</span>
                    <span>Graduación: {profile.graduation_year}</span>
                  </div>
                )}
              </div>
            </div>

            {profile.interests && (
              <div className="card">
                <h4>💡 Intereses</h4>
                <div className="interests-tags">
                  {profile.interests.split(',').map((interest, i) => (
                    <span key={i} className="badge badge-primary">{interest.trim()}</span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Posts Wall */}
          <main className="profile-wall">
            <h3 className="wall-title">📰 Publicaciones ({posts.length})</h3>
            {posts.length === 0 ? (
              <div className="card text-center" style={{padding:48}}>
                <p style={{fontSize:'3rem',marginBottom:12}}>📭</p>
                <p className="text-muted">
                  {isOwnProfile ? 'Aún no has publicado nada. ¡Comparte algo!' : 'Sin publicaciones aún.'}
                </p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="card post-card animate-fadeIn" style={{marginBottom:16}}>
                  <div className="post-body"><p>{post.content}</p></div>
                  <div className="post-stats">
                    <span>{post.like_count > 0 && <>❤️ {post.like_count}</>}</span>
                    <span>{post.comments_count > 0 && <>{post.comments_count} comentarios</>}</span>
                    <span className="text-muted">{timeAgo(post.created_at)}</span>
                  </div>
                  <div className="post-actions">
                    <button className={`btn-ghost post-action ${post.liked_by_me ? 'liked' : ''}`}
                      onClick={() => handleLike(post.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={post.liked_by_me ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                      Me gusta
                    </button>
                  </div>
                </div>
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
