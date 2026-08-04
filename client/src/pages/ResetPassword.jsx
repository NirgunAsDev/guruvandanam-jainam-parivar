import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { BRAND } from '../lang';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setMsg({ ok: false, text: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.resetPassword(token, password);
      setMsg({ ok: true, text: res.message });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <img src={BRAND.logoPath} alt={BRAND.logoAlt} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '0' }} />
          </div>
          <p>{BRAND.orgGu} આયોજિત</p>
          <h1>{BRAND.nameGu}</h1>
        </div>

        <div className="auth-card">
          <h2>Set New Password</h2>

          {!token && (
            <div className="alert alert-error">Invalid reset link. Please request a new one.</div>
          )}

          {msg && (
            <div className={`alert ${msg.ok ? 'alert-success' : 'alert-error'}`}>{msg.text}</div>
          )}

          {token && !msg?.ok && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn-primary btn-full" disabled={loading}>
                {loading ? 'Updating…' : 'Set New Password'}
              </button>
            </form>
          )}

          <div className="auth-footer" style={{ marginTop: 16 }}>
            <p><Link to="/login">← Back to Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
