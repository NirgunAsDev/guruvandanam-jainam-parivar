import React, { useState } from 'react';
import VideoModal from '../components/VideoModal';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';
import { t, BRAND } from '../lang';

const T = t['en'];

function calcAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.forgotPassword(email);
      setMsg({ ok: true, text: res.message });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h2>Reset Password</h2>
      <p className="auth-subtitle">Enter your registered email and we'll send you a reset link.</p>
      {msg && <div className={`alert ${msg.ok ? 'alert-success' : 'alert-error'}`}>{msg.text}</div>}
      {!msg?.ok && (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{T.email}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      )}
      <div className="auth-footer">
        <p><button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--saffron)', textDecoration: 'underline', font: 'inherit' }}>← Back to Sign In</button></p>
      </div>
    </div>
  );
}

export default function AuthPage({ mode }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const isLogin = mode === 'login';

  const [form, setForm] = useState({ name: '', email: '', password: '', dob: '', phone: '', address: '', city: '', state: '', zipcode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handlePhoneChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm(f => ({ ...f, phone: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const age = calcAge(form.dob);
      if (!isLogin && (age === null || age < 6 || age > 60)) {
        setError('Age must be between 6 and 60.');
        setLoading(false);
        return;
      }
      const data = isLogin
        ? await api.login({ email: form.email, password: form.password })
        : await api.register({ name: form.name, email: form.email, password: form.password, age, phone: form.phone, address: form.address, city: form.city, state: form.state, zipcode: form.zipcode });
      login(data.user, data.token);
      navigate(!data.user.phone ? '/account' : '/landing');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getAgeGroupLabel(dob) {
    const a = calcAge(dob);
    if (a === null) return '';
    if (a >= 6 && a <= 15) return `👦 ${T.g1label}`;
    if (a >= 15 && a <= 25) return `🧑 ${T.g2label}`;
    if (a >= 26 && a <= 60) return `👨 ${T.g3label}`;
    return '';
  }

  // Max DOB: must be at least 6 years old
  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 6);
    return d.toISOString().split('T')[0];
  })();
  // Min DOB: must be at most 60 years old
  const minDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 60);
    return d.toISOString().split('T')[0];
  })();

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo"><img src={BRAND.logoPath} alt={BRAND.logoAlt} style={{width:'100%',height:'100%',objectFit:'contain',borderRadius:'0'}} /></div>
          <p>{BRAND.orgGu} આયોજિત</p>
          <img src="/guruvandanam-logo.png" alt={BRAND.nameGu} className="auth-title-logo" />
        </div>

        <div className="video-preview-banner" onClick={() => setShowVideo(true)}>
          <div className="video-play-circle">▶</div>
          <div className="video-preview-text">
            <div className="video-preview-label">Help Video — આરાધના પત્રક</div>
            <div className="video-preview-sub">सहायता वीडियो / મદદ વિડિઓ</div>
          </div>
          <div className="video-preview-arrow">›</div>
        </div>

        {isLogin && showForgot ? (
          <ForgotPasswordForm onBack={() => setShowForgot(false)} />
        ) : (
        <div className="auth-card">
          <h2>{isLogin ? T.welcomeBack : T.joinChallenge}</h2>
          {!isLogin && (
            <p className="auth-subtitle"></p>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label>{T.fullName}</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder={T.fullName} required />
              </div>
            )}
            <div className="form-group">
              <label>{T.email}</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" required />
            </div>
            <div className="form-group">
              <label>{T.password}</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
            </div>
            {!isLogin && (
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" name="dob" value={form.dob} onChange={handleChange} min={minDob} max={maxDob} required />
                {form.dob && <div className="age-group-hint">{getAgeGroupLabel(form.dob)}{calcAge(form.dob) !== null ? ` (Age ${calcAge(form.dob)})` : ''}</div>}
              </div>
            )}
            {!isLogin && (
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" value={form.phone} onChange={handlePhoneChange} placeholder="10-digit mobile number" inputMode="numeric" maxLength={10} />
                {form.phone.length > 0 && form.phone.length < 10 && (
                  <span className="field-hint">{form.phone.length}/10 digits</span>
                )}
              </div>
            )}
            {!isLogin && (
              <div className="form-group">
                <label>Address</label>
                <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Street address" />
              </div>
            )}
            {!isLogin && (
              <div className="form-group">
                <label>City</label>
                <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="City" />
              </div>
            )}
            {!isLogin && (
              <div className="form-group">
                <label>State</label>
                <select name="state" value={form.state} onChange={handleChange} className="form-select">
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            {!isLogin && (
              <div className="form-group">
                <label>ZIP Code</label>
                <input type="text" name="zipcode" value={form.zipcode} onChange={handleChange} placeholder="ZIP code" />
              </div>
            )}
            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? T.loading : isLogin ? T.signIn : T.register}
            </button>
          </form>

          <div className="auth-footer">
            {isLogin ? (
              <>
                <p>{T.newHere} <Link to="/register">{T.registerHere}</Link></p>
                <p style={{ marginTop: 8 }}>
                  <button onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--saffron)', textDecoration: 'underline', font: 'inherit', fontSize: 13 }}>
                    Forgot password?
                  </button>
                </p>
              </>
            ) : (
              <p>{T.alreadyReg} <Link to="/login">{T.signIn}</Link></p>
            )}
          </div>
        </div>
        )}  {/* end isLogin && showForgot conditional */}

        {!isLogin && (
          <div className="auth-info">
            <h3>{T.competitionRules}</h3>
            <ul>
              <li>૦૧ એપ્રિલ ૨૦૨૬, બુધવાર → ૩૧ જુલાઈ ૨૦૨૬, શુક્રવાર</li>
              <li>Registration ફી ₹૨૦૦/-</li>
            </ul>
            <div className="payment-qr-section">
              <p className="payment-qr-title">📲 Registration ફી ચૂકવો</p>
              <img src="/payment-qr.png" alt="UPI Payment QR" className="payment-qr-img" />
              <p className="payment-upi-id">UPI ID: <strong>devisinghbca96@oksbi</strong></p>
              <div className="payment-warning">
                ⚠️ જો ₹200 ફી ભરવામાં નહીં આવે, તો activity points ગણવામાં આવશે નહીં.<br />
                <span>If ₹200 registration fee is not paid, activity points will not be counted.</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <VideoModal isOpen={showVideo} onClose={() => setShowVideo(false)} />
    </div>
  );
}
