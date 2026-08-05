import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { api } from './api';
import { LangContext, t, BRAND } from './lang';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UserAccount from './pages/UserAccount';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import AdminUserDetail from './pages/AdminUserDetail';
import LandingPage from './pages/LandingPage';
import PaymentInfo from './pages/PaymentInfo';
import ResetPassword from './pages/ResetPassword';

export const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

function SplashScreen() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  function handleAnimationEnd(e) {
    // Only the overlay's own fade-out animation should dismiss it —
    // the logo's zoom-in animation also bubbles an animationend event.
    if (e.animationName === 'splashFadeOut') setVisible(false);
  }
  return (
    <div className="app-splash" onAnimationEnd={handleAnimationEnd}>
      <img src="/guruvandanam-logo.png" alt={BRAND.nameGu} className="app-splash-logo" />
    </div>
  );
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  const { lang, activityLang, toggleActivityLang } = useContext(LangContext);
  const T = t[lang];
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-layout">
      <nav className="navbar">
        <div className="nav-brand">
          <img src={BRAND.logoPath} alt={BRAND.logoAlt} className="nav-logo-img" />
        </div>

        {/* Hamburger for mobile */}
        <button className="nav-hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
          <span /><span /><span />
        </button>

        <div className={`nav-links ${menuOpen ? 'nav-links--open' : ''}`}>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>
            {T.dashboard}
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>
            {T.myProgress}
          </NavLink>
          <NavLink to="/account" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>
            Profile
          </NavLink>
          <NavLink to="/payment" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>
            Payment Info
          </NavLink>
          <NavLink to="/landing" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>
            {T.rules}
          </NavLink>
          <a
            href="https://chat.whatsapp.com/FUbsmc50FWy37dXyqTwg1V?mode=gi_t"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link nav-link--whatsapp"
            onClick={() => setMenuOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{display:'inline',verticalAlign:'middle',marginRight:'5px',marginBottom:'2px'}}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Join WhatsApp Group
          </a>
          {user?.is_admin ? (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>
              {T.admin}
            </NavLink>
          ) : null}
        </div>

        <div className="nav-user">
          <div className="activity-lang-toggle activity-lang-toggle--navbar">
            <button
              className={`activity-lang-btn ${activityLang === 'gu' ? 'activity-lang-btn--active' : ''}`}
              onClick={() => activityLang !== 'gu' && toggleActivityLang()}
            >
              ગુ
            </button>
            <button
              className={`activity-lang-btn ${activityLang === 'hi' ? 'activity-lang-btn--active' : ''}`}
              onClick={() => activityLang !== 'hi' && toggleActivityLang()}
            >
              हि
            </button>
          </div>
          <span className="nav-username">{user?.name}</span>
          <span className="nav-points">{(user?.total_guruvandans || 0).toLocaleString()} guruvandans</span>
          <button onClick={handleLogout} className="btn-logout">{T.logout}</button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}

      {!!user?.is_disqualified && (
        <div className="disqualified-banner">
          ⚠️ તમને આ સ્પર્ધામાંથી ગેરલાયક ઠેરવવામાં આવ્યા છે. વધુ માહિતી માટે આયોજકોનો સંપર્ક કરો.
        </div>
      )}

      <main className="main-content">{children}</main>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { user, meLoaded } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  if (!meLoaded) return null;
  if (!user.phone && location.pathname !== '/account' && location.pathname !== '/payment') return <Navigate to="/account" replace />;
  if (!user.is_admin && !user.registration_fee_paid && location.pathname !== '/payment' && location.pathname !== '/account') {
    return <Navigate to="/payment" replace />;
  }
  return <Layout>{children}</Layout>;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [meLoaded, setMeLoaded] = useState(false);

  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [activityLang, setActivityLang] = useState(() => localStorage.getItem('activityLang') || 'gu');

  function toggleLang() {
    setLang(l => {
      const next = l === 'en' ? 'gu' : 'en';
      localStorage.setItem('lang', next);
      return next;
    });
  }

  function toggleActivityLang() {
    setActivityLang(l => {
      const next = l === 'gu' ? 'hi' : 'gu';
      localStorage.setItem('activityLang', next);
      return next;
    });
  }

  function login(userData, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    if (!userData.phone) {
      localStorage.setItem('phonePrompt', '1');
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  useEffect(() => {
    if (!user) { setMeLoaded(true); return; }
    api.me().then(freshUser => {
      setUser(prev => {
        const updated = { ...prev, ...freshUser };
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
      });
    }).catch(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }).finally(() => setMeLoaded(true));
  }, []);

  function updateUserPoints(total_guruvandans) {
    setUser(prev => {
      const updated = { ...prev, total_guruvandans };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }

  function updateUser(patch) {
    setUser(prev => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }

  return (
    <LangContext.Provider value={{ lang, toggleLang, activityLang, toggleActivityLang }}>
      <AuthContext.Provider value={{ user, meLoaded, login, logout, updateUserPoints, updateUser }}>
        <SplashScreen />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/account" element={<PrivateRoute><UserAccount /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
            <Route path="/payment" element={<PrivateRoute><PaymentInfo /></PrivateRoute>} />
            <Route path="/admin/users/:id" element={<PrivateRoute><AdminUserDetail /></PrivateRoute>} />
            <Route path="*" element={<Navigate to={user ? '/landing' : '/login'} replace />} />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </LangContext.Provider>
  );
}
