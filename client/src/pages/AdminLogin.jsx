import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';
import { LangContext, t, BRAND } from '../lang';
import LangSlider from '../components/LangSlider';

export default function AdminLogin() {
  const { login } = useAuth();
  const { lang } = useContext(LangContext);
  const T = t[lang];
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.adminLogin(form);
      login(data.user, data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-lang-toggle">
        <LangSlider variant="auth" />
      </div>

      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">🛡️</div>
          <h1>{T.adminPanel}</h1>
          <p>{BRAND.name} — Restricted Access</p>
        </div>

        <div className="auth-card">
          <h2>{T.adminSignIn}</h2>
          <p className="auth-subtitle">{T.adminOnly}</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>{T.email}</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder={BRAND.adminEmailPlaceholder} required />
            </div>
            <div className="form-group">
              <label>{T.password}</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? T.loading : T.adminSignIn}
            </button>
          </form>

          <div className="auth-footer">
            <a href="/login" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              {T.backToLogin}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
