import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsApi, profileApi } from '../services/api';
import './FeedPage.css';

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

function getInitials(name) {
  return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
}

function Avatar({ src, name, size, style }) {
  const s = size || 42;
  if (src) {
    return (
      <div className="avatar" style={{ width: s, height: s, ...style }}>
        <img src={src} alt={name} />
      </div>
    );
  }
  return (
    <div className="avatar" style={{ width: s, height: s, fontSize: s * 0.35, ...style }}>
      {getInitials(name)}
    </div>
  );
}

function PostCard({ post, currentUserId, onLike, onComment }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setLoadingComments(true);
    try {
      const data = await postsApi.getComments(post.id);
      setComments(data.comments);
      setShowComments(true);
    } catch (err) { console.error(err); }
    finally { setLoadingComments(false); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const data = await postsApi.addComment(post.id, newComment);
      setComments(prev => [...prev, data.comment]);
      setNewComment('');
      onComment(post.id);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="post-card card animate-fadeIn">
      <div className="post-header">
        <Link to={`/profile/${post.user_id}`} className="post-author">
          <Avatar src={post.author_pic} name={post.author_name} size={44} />
          <div className="post-author-info">
            <span className="post-author-name">{post.author_name}</span>
            <span className="post-meta">
              {post.university_acronym && <span className="badge badge-primary">{post.university_acronym}</span>}
              <span className="post-time">{timeAgo(post.created_at)}</span>
            </span>
          </div>
        </Link>
      </div>

      <div className="post-body">
        <p>{post.content}</p>
      </div>

      <div className="post-stats">
        <span className="stat-likes">
          {post.like_count > 0 && <>❤️ {post.like_count}</>}
        </span>
        <span>{post.comments_count > 0 && <>{post.comments_count} comentarios</>}</span>
      </div>

      <div className="post-actions">
        <button className={`btn-ghost post-action ${post.liked_by_me ? 'liked' : ''}`}
          onClick={() => onLike(post.id)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={post.liked_by_me ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          Me gusta
        </button>
        <button className="btn-ghost post-action" onClick={loadComments}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Comentar{post.comments_count > 0 ? ` (${post.comments_count})` : ''}
        </button>
      </div>

      {showComments && (
        <div className="post-comments animate-fadeIn">
          {comments.map(c => (
            <div key={c.id} className="comment">
              <Link to={`/profile/${c.user_id}`}>
                <Avatar src={c.author_pic} name={c.author_name} size={30} />
              </Link>
              <div className="comment-bubble">
                <Link to={`/profile/${c.user_id}`} className="comment-author">{c.author_name}</Link>
                <p>{c.content}</p>
              </div>
            </div>
          ))}
          <form className="comment-form" onSubmit={handleComment}>
            <Avatar name="Tú" size={30} />
            <input className="input comment-input" placeholder="Escribe un comentario..."
              value={newComment} onChange={e => setNewComment(e.target.value)} />
          </form>
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsType, setSuggestionsType] = useState('');

  useEffect(() => { loadFeed(); loadSuggestions(); }, []);

  const loadFeed = async () => {
    try { const data = await postsApi.getFeed(); setPosts(data.posts); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadSuggestions = async () => {
    try {
      const data = await profileApi.getSuggestions();
      setSuggestions(data.suggestions || []);
      setSuggestionsType(data.type);
    } catch (err) { console.error(err); }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const data = await postsApi.create(newPost);
      setPosts(prev => [data.post, ...prev]);
      setNewPost('');
    } catch (err) { console.error(err); }
    finally { setPosting(false); }
  };

  const handleLike = async (postId) => {
    try {
      const data = await postsApi.toggleLike(postId);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, liked_by_me: data.liked ? 1 : 0, like_count: data.likeCount } : p
      ));
    } catch (err) { console.error(err); }
  };

  const handleComment = (postId) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
    ));
  };

  return (
    <div className="feed-page container">
      <div className="feed-layout">
        {/* Left sidebar */}
        <aside className="feed-sidebar hide-mobile">
          <div className="card sidebar-profile">
            <div className="sidebar-cover">
              <img src="/images/hero-bg.png" alt="" className="sidebar-cover-img" />
            </div>
            <div className="sidebar-avatar-wrap">
              <Avatar src={user?.profile_pic} name={user?.full_name} size={72} />
            </div>
            <h3>{user?.full_name}</h3>
            <p className="text-muted sidebar-bio">{user?.bio || 'Estudiante en UniNetwork'}</p>
            {user?.university_acronym && <span className="badge badge-primary">{user.university_acronym}</span>}
            <Link to={`/profile/${user?.id}`} className="btn btn-secondary btn-sm sidebar-profile-btn">
              Ver mi perfil
            </Link>
          </div>

          <div className="card sidebar-links">
            <Link to="/search" className="sidebar-link">
              <div className="sidebar-link-icon">🔍</div>
              <div>
                <span className="sidebar-link-title">Buscar Carreras</span>
                <span className="sidebar-link-desc">Encuentra tu futuro</span>
              </div>
            </Link>
            <Link to="/universities" className="sidebar-link">
              <div className="sidebar-link-icon">🏛️</div>
              <div>
                <span className="sidebar-link-title">Universidades</span>
                <span className="sidebar-link-desc">Directorio completo</span>
              </div>
            </Link>
          </div>
        </aside>

        {/* Main Feed */}
        <main className="feed-main">
          <form className="card post-composer" onSubmit={handlePost} id="post-composer">
            <div className="composer-top">
              <Avatar src={user?.profile_pic} name={user?.full_name} size={42} />
              <textarea className="input composer-input"
                placeholder="¿Qué estás pensando? Comparte con la comunidad..."
                value={newPost} onChange={e => setNewPost(e.target.value)} rows={2} />
            </div>
            <div className="composer-bottom">
              <div className="composer-actions">
                <button type="button" className="composer-action-btn">📷 Foto</button>
                <button type="button" className="composer-action-btn">📎 Archivo</button>
                <button type="button" className="composer-action-btn">📊 Encuesta</button>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={posting || !newPost.trim()}>
                {posting ? 'Publicando...' : '✨ Publicar'}
              </button>
            </div>
          </form>

          {loading ? (
            <div className="loader-container"><div className="spinner" /></div>
          ) : posts.length === 0 ? (
            <div className="card text-center" style={{padding:48}}>
              <p style={{fontSize:'3rem',marginBottom:12}}>📝</p>
              <h3 style={{color:'var(--text-white)',marginBottom:8}}>¡Sé el primero!</h3>
              <p className="text-muted">Comparte algo con la comunidad universitaria</p>
            </div>
          ) : (
            posts.map((post, i) => (
              <PostCard key={post.id} post={post} currentUserId={user?.id}
                onLike={handleLike} onComment={handleComment} />
            ))
          )}
        </main>

        {/* Right sidebar */}
        <aside className="feed-sidebar-right hide-mobile">
          <div className="card">
            <h4 className="sidebar-title">
              {suggestionsType === 'career_recommendations' ? '🎓 Carreras Para Ti' : '👥 Sugerencias'}
            </h4>
            {suggestions.length === 0 ? (
              <p className="text-muted" style={{fontSize:'0.85rem'}}>Sin sugerencias por ahora</p>
            ) : suggestionsType === 'career_recommendations' ? (
              suggestions.slice(0, 5).map((s, i) => (
                <div key={i} className="suggestion-item">
                  <div className="suggestion-icon">📚</div>
                  <div className="suggestion-info">
                    <span className="suggestion-name">{s.name}</span>
                    <span className="text-muted" style={{fontSize:'0.72rem'}}>{s.university_acronym} · {s.faculty}</span>
                  </div>
                </div>
              ))
            ) : (
              suggestions.slice(0, 5).map((s, i) => (
                <Link to={`/profile/${s.id}`} key={i} className="suggestion-item">
                  <Avatar src={s.profile_pic} name={s.full_name} size={36} />
                  <div className="suggestion-info">
                    <span className="suggestion-name">{s.full_name}</span>
                    <span className="text-muted" style={{fontSize:'0.72rem'}}>{s.university_acronym || '🎒 Bachiller'}</span>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="card" style={{marginTop:16}}>
            <h4 className="sidebar-title">🔥 Tendencias</h4>
            {['#Promoción2026','#IngenieríaDeSistemas','#HackathonBolivia','#UMSA','#CodingTips'].map(t => (
              <div key={t} className="trending-item">{t}</div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
