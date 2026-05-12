import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import UniversitiesPage from './pages/UniversitiesPage';
import VocationalTestPage from './pages/VocationalTestPage';
import Navbar from './components/Navbar';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="loader-container"><div className="spinner" /></div>;
  if (!token) return <Navigate to="/login" />;
  return children;
}

function GuestRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="loader-container"><div className="spinner" /></div>;
  if (token) return <Navigate to="/feed" />;
  return children;
}

export default function App() {
  const { token } = useAuth();

  return (
    <div className="app">
      {token && <Navbar />}
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        <Route path="/vocational" element={<ProtectedRoute><VocationalTestPage /></ProtectedRoute>} />
        <Route path="/universities" element={<ProtectedRoute><UniversitiesPage /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={token ? "/feed" : "/login"} />} />
      </Routes>
    </div>
  );
}
