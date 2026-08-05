import React, { useState, useEffect, useContext } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { Navigate, useNavigate } from 'react-router-dom';
import { LangContext, t } from '../lang';

const GOAL = 1008;

// Mini bar chart used in the detail panel
function MiniChart({ dailyLogs }) {
  if (!dailyLogs?.length) return <div style={{ color: 'var(--text-mid)', fontStyle: 'italic', fontSize: 12 }}>No activity yet</div>;
  const maxPts = Math.max(...dailyLogs.map(d => d.count), 1);
  const rows = [...dailyLogs].reverse().slice(-14);
  return (
    <div className="daily-chart" style={{ height: 90 }}>
      {rows.map(d => {
        const pct = Math.min(100, (d.count / maxPts) * 100);
        return (
          <div key={d.date} className="day-bar-wrap">
            <div className="day-bar-container">
              <div className="day-bar" style={{ height: `${Math.max(4, pct)}%` }} title={`${d.count} guruvandans`} />
            </div>
            <div className="day-label">{d.date.slice(5)}</div>
            <div className="day-pts">{d.count}</div>
          </div>
        );
      })}
    </div>
  );
}

// Slide-in detail panel for a selected user
function UserDetailPanel({ userId, onClose, T }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pwForm, setPwForm] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setPwForm(false);
    setNewPw('');
    setPwMsg(null);
    api.getUserSummary(userId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleResetPassword(e) {
    e.preventDefault();
    setPwSaving(true);
    setPwMsg(null);
    try {
      await api.resetUserPassword(userId, newPw);
      setPwMsg({ ok: true, text: 'Password updated successfully.' });
      setNewPw('');
      setPwForm(false);
    } catch (err) {
      setPwMsg({ ok: false, text: err.message });
    } finally {
      setPwSaving(false);
    }
  }

  const progress = data ? Math.min(100, (data.user.total_guruvandans / GOAL) * 100) : 0;

  return (
    <>
      <div className="detail-overlay" onClick={onClose} />
      <div className="detail-panel">
        <div className="detail-panel-header">
          <h2>{T.myProgressTitle}</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="detail-fullpage-btn"
              onClick={() => { onClose(); navigate(`/admin/users/${userId}`); }}
            >
              Full Details →
            </button>
            <button className="detail-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">{T.loading}</div>
        ) : !data ? (
          <div className="empty-state">Failed to load</div>
        ) : (
          <div className="detail-body">
            {/* User info */}
            <div className="detail-user-card">
              <div className="profile-avatar" style={{ width: 52, height: 52, fontSize: 22, margin: '0 0 0 0', flexShrink: 0 }}>
                {data.user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="detail-user-name">{data.user.name}</div>
                <div className="detail-user-meta">{data.user.email}</div>
                <div className="detail-user-meta">
                  Age {data.user.age} · G{data.user.group_num}
                  {data.user.registration_fee_paid
                    ? <span className="detail-badge detail-badge--green">✓ Fee Paid</span>
                    : <span className="detail-badge detail-badge--red">✕ Fee Pending</span>}
                </div>
                {(data.user.sangh_name || data.user.mahatma_name || data.user.mahatma_thana) && (
                  <div className="detail-user-meta">
                    Sangh: {data.user.sangh_name || '—'} · Mahatma: {data.user.mahatma_name || '—'} · Thana: {data.user.mahatma_thana || '—'}
                  </div>
                )}
              </div>
            </div>

            {/* Password reset */}
            <div style={{ margin: '12px 0' }}>
              {!pwForm ? (
                <button
                  className="toggle-btn toggle-off"
                  style={{ fontSize: 13, padding: '6px 14px' }}
                  onClick={() => { setPwForm(true); setPwMsg(null); }}
                >
                  Reset Password
                </button>
              ) : (
                <form onSubmit={handleResetPassword} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="password"
                    placeholder="New password (min 6 chars)"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    minLength={6}
                    required
                    style={{ flex: 1, minWidth: 160, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                  />
                  <button type="submit" className="toggle-btn toggle-on" style={{ fontSize: 13, padding: '6px 14px' }} disabled={pwSaving}>
                    {pwSaving ? 'Saving…' : 'Set Password'}
                  </button>
                  <button type="button" className="toggle-btn toggle-off" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => { setPwForm(false); setPwMsg(null); setNewPw(''); }}>
                    Cancel
                  </button>
                </form>
              )}
              {pwMsg && (
                <div style={{ marginTop: 6, fontSize: 13, color: pwMsg.ok ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)' }}>
                  {pwMsg.text}
                </div>
              )}
            </div>

            {/* Points + progress */}
            <div className="detail-stats-row">
              <div className="detail-stat">
                <div className="detail-stat-val">{data.user.total_guruvandans.toLocaleString()}</div>
                <div className="detail-stat-lbl">{T.totalGuruvandansLabel}</div>
              </div>
              <div className="detail-stat">
                <div className="detail-stat-val">{Math.max(0, GOAL - data.user.total_guruvandans).toLocaleString()}</div>
                <div className="detail-stat-lbl">{T.remainingLabel}</div>
              </div>
              <div className="detail-stat">
                <div className="detail-stat-val">{data.dailyLogs.length}</div>
                <div className="detail-stat-lbl">{T.activeDaysLabel}</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="progress-header">
                <span>{T.competitionGoal}</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Activity chart */}
            <div className="detail-section-title">{T.recentActivity}</div>
            <MiniChart dailyLogs={data.dailyLogs} />
          </div>
        )}
      </div>
    </>
  );
}

function LandingVideoSection() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // { ok, text }
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLandingVideo()
      .then(res => setCurrentUrl(res.landing_video_url || ''))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setStatus({ ok: false, text: 'Please select a video file first.' });
      return;
    }
    
    setUploading(true);
    setStatus(null);
    
    try {
      const formData = new FormData();
      formData.append('video', file);
      
      const res = await api.uploadLandingVideo(formData);
      setCurrentUrl(res.landing_video_url);
      setFile(null);
      setStatus({ ok: true, text: 'Video uploaded successfully! It is now live on the landing page.' });
      
      // Reset input
      const fileInput = document.getElementById('landing-video-upload');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!window.confirm('Are you sure you want to remove the landing page video?')) return;
    setUploading(true);
    setStatus(null);
    try {
      await api.removeLandingVideo();
      setCurrentUrl('');
      setStatus({ ok: true, text: 'Video removed. Landing page will load normally without a video.' });
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>🎬 Landing Page — Welcome Video</div>
      <div style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 12 }}>
        Upload an MP4 video here. Logged-in users will see this video auto-play in a modal when they visit the landing page.
      </div>
      
      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--text-mid)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {currentUrl && (
            <div style={{ background: 'rgba(212,160,23,0.1)', padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 13, wordBreak: 'break-all' }}>
                <strong>Current Video:</strong> <br/>
                <a href={currentUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--maroon)' }}>{currentUrl}</a>
              </div>
              <button
                type="button"
                className="btn-danger"
                style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
                onClick={handleRemove}
                disabled={uploading}
              >
                Remove
              </button>
            </div>
          )}

          <form onSubmit={handleUpload} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
            <input
              id="landing-video-upload"
              type="file"
              accept="video/mp4,video/webm"
              onChange={e => { setFile(e.target.files[0] || null); setStatus(null); }}
              style={{ flex: 1, minWidth: 240, padding: '6px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: 13 }}
            />
            <button
              type="submit"
              className="toggle-btn toggle-on"
              style={{ fontSize: 13, padding: '7px 18px', whiteSpace: 'nowrap' }}
              disabled={uploading || !file}
            >
              {uploading ? 'Uploading… (This may take a minute)' : 'Upload New Video'}
            </button>
          </form>
        </div>
      )}
      
      {status && (
        <div style={{ marginTop: 10, fontSize: 13, color: status.ok ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)' }}>
          {status.ok ? '✓ ' : '✕ '}{status.text}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const { lang } = useContext(LangContext);
  const T = t[lang];

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState({});
  const [groupFilter, setGroupFilter] = useState('all');
  const [sortBy, setSortBy] = useState('points');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [showDisqualified, setShowDisqualified] = useState(false);
  const [disqualifiedUsers, setDisqualifiedUsers] = useState([]);
  const [disqLoading, setDisqLoading] = useState(false);

  useEffect(() => {
    if (!user?.is_admin) return;
    api.getAdminUsers(false).then(setUsers).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user?.is_admin || !showDeleted) return;
    setDeletedLoading(true);
    api.getAdminUsers(true).then(setDeletedUsers).finally(() => setDeletedLoading(false));
  }, [user, showDeleted]);

  useEffect(() => {
    if (!user?.is_admin || !showDisqualified) return;
    setDisqLoading(true);
    api.getAdminUsers(false, true).then(setDisqualifiedUsers).finally(() => setDisqLoading(false));
  }, [user, showDisqualified]);

  if (!user?.is_admin) return <Navigate to="/admin-login" replace />;

  async function toggleFee(e, u) {
    e.stopPropagation();
    setSaving(s => ({ ...s, [u.id + '_fee']: true }));
    try {
      await api.setFeePaid(u.id, !u.registration_fee_paid);
      setUsers(us => us.map(x => x.id === u.id ? { ...x, registration_fee_paid: !u.registration_fee_paid } : x));
    } finally {
      setSaving(s => ({ ...s, [u.id + '_fee']: false }));
    }
  }

  async function toggleDelete(e, u) {
    e.stopPropagation();
    if (u.id === user.id) return;
    const newVal = !u.is_deleted;
    setSaving(s => ({ ...s, [u.id + '_delete']: true }));
    try {
      await api.deleteUser(u.id, newVal);
      if (newVal) {
        setUsers(us => us.filter(x => x.id !== u.id));
        if (showDeleted) setDeletedUsers(ds => [...ds, { ...u, is_deleted: 1 }]);
      } else {
        setDeletedUsers(ds => ds.filter(x => x.id !== u.id));
        setUsers(us => [...us, { ...u, is_deleted: 0 }]);
      }
    } finally {
      setSaving(s => ({ ...s, [u.id + '_delete']: false }));
    }
  }

  async function restoreDisqualified(e, u) {
    e.stopPropagation();
    setSaving(s => ({ ...s, [u.id + '_disq']: true }));
    try {
      await api.disqualifyUser(u.id, false);
      setDisqualifiedUsers(ds => ds.filter(x => x.id !== u.id));
      setUsers(us => [...us, { ...u, is_disqualified: 0 }]);
    } finally {
      setSaving(s => ({ ...s, [u.id + '_disq']: false }));
    }
  }

  function handleSort(col) {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir(col === 'name' ? 'asc' : 'desc');
    }
  }

  function sortIcon(col) {
    if (sortBy !== col) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  }

  // Use active, deleted, or disqualified list based on toggle
  const activeList = showDeleted ? deletedUsers : showDisqualified ? disqualifiedUsers : users;

  // Filter
  const afterFilter = activeList.filter(u => {
    const matchGroup = groupFilter === 'all' || u.group_num === groupFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchGroup && matchSearch;
  });

  // Sort
  const sorted = [...afterFilter].sort((a, b) => {
    let valA, valB;
    if (sortBy === 'points') { valA = a.total_guruvandans; valB = b.total_guruvandans; }
    else if (sortBy === 'age') { valA = a.age; valB = b.age; }
    else if (sortBy === 'name') { valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); }
    else if (sortBy === 'rank') { valA = activeList.indexOf(a); valB = activeList.indexOf(b); }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  function exportCSV() {
    const headers = ['Rank', 'Name', 'Email', 'Phone', 'Age', 'Group', 'Total Guruvandans', 'Fee Status', 'Admin', 'Address', 'City', 'State', 'ZIP Code', 'Sangh Name', 'Mahatma Name', 'Mahatma Thana', 'Joined'];
    const rows = users.map((u, i) => [
      i + 1,
      u.name,
      u.email,
      u.phone || '',
      u.age,
      `G${u.group_num}`,
      u.total_guruvandans,
      u.registration_fee_paid ? 'Paid' : 'Pending',
      u.is_admin ? 'Yes' : 'No',
      u.address || '',
      u.city || '',
      u.state || '',
      u.zipcode || '',
      u.sangh_name || '',
      u.mahatma_name || '',
      u.mahatma_thana || '',
      u.created_at ? u.created_at.slice(0, 10) : '',
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalUsers = users.length;
  const feePaid = users.filter(u => u.registration_fee_paid).length;
  const goalMet = users.filter(u => u.total_guruvandans >= GOAL).length;

  return (
    <div className="page-container">
      <h1>{T.adminPanel}</h1>

      <LandingVideoSection />

      {/* Summary stats */}
      <div className="admin-stats">
        <div className="admin-stat"><strong>{totalUsers}</strong><span>{T.totalUsers}</span></div>
        <div className="admin-stat"><strong>{feePaid}</strong><span>{T.feePaid}</span></div>
        <div className="admin-stat"><strong>{totalUsers - feePaid}</strong><span>{T.feePending}</span></div>
        <div className="admin-stat"><strong>{goalMet}</strong><span>{T.goalMetLabel}</span></div>
      </div>

      {/* Group filter + search row */}
      <div className="admin-controls">
        <div className="filter-row" style={{ marginBottom: 0, flexWrap: 'nowrap' }}>
          {['all', '1', '2', '3'].map(g => (
            <button
              key={g}
              className={`filter-btn ${groupFilter === g ? 'active' : ''}`}
              onClick={() => setGroupFilter(g)}
            >
              {g === 'all' ? T.allGroups : `G${g}`}
            </button>
          ))}
        </div>

        <div className="search-row" style={{ marginBottom: 0 }}>
          <input
            type="text"
            placeholder={T.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          <span className="search-count">{sorted.length} {T.users}</span>
          <button
            className="toggle-btn toggle-off"
            style={{ whiteSpace: 'nowrap', fontSize: 13, padding: '6px 14px' }}
            onClick={exportCSV}
            disabled={users.length === 0}
            title="Export all users to CSV"
          >
            ↓ Export CSV
          </button>
          <button
            className={`toggle-btn ${showDeleted ? 'toggle-on' : 'toggle-off'}`}
            style={{ whiteSpace: 'nowrap', fontSize: 13, padding: '6px 14px' }}
            onClick={() => { setShowDeleted(s => !s); setShowDisqualified(false); }}
          >
            {showDeleted ? 'Show Active Users' : 'Show Deleted Users'}
          </button>
          <button
            className={`toggle-btn ${showDisqualified ? 'toggle-on' : 'toggle-off'}`}
            style={{ whiteSpace: 'nowrap', fontSize: 13, padding: '6px 14px' }}
            onClick={() => { setShowDisqualified(s => !s); setShowDeleted(false); }}
          >
            {showDisqualified ? 'Show Active Users' : 'Show Disqualified'}
          </button>
        </div>
      </div>

      {/* Sort controls */}
      <div className="sort-row">
        <span className="sort-label">Sort:</span>
        {[
          { key: 'rank', label: T.rank },
          { key: 'points', label: T.pointsLabel },
          { key: 'age', label: T.age },
          { key: 'name', label: T.name },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`sort-btn ${sortBy === key ? 'sort-btn--active' : ''}`}
            onClick={() => handleSort(key)}
          >
            {label}{sortIcon(key)}
          </button>
        ))}
      </div>

      {(loading || deletedLoading || disqLoading) ? (
        <div className="loading-spinner">{T.loading}</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th onClick={() => handleSort('name')} className="th-sortable">{T.name}{sortIcon('name')}</th>
                <th className="col-hide-sm">{T.emailLabel}</th>
                <th onClick={() => handleSort('age')} className="th-sortable col-hide-sm">{T.age}{sortIcon('age')}</th>
                <th>{T.groupLabel}</th>
                <th onClick={() => handleSort('points')} className="th-sortable">{T.pointsLabel}{sortIcon('points')}</th>
                <th>{T.feeLabel}</th>
                <th className="col-hide-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((u, i) => {
                const rank = activeList.indexOf(u) + 1;
                const pct = Math.min(100, (u.total_guruvandans / GOAL) * 100);
                return (
                  <tr
                    key={u.id}
                    className={`admin-row ${u.id === user.id ? 'my-row' : ''}`}
                    onClick={() => setSelectedUserId(u.id)}
                    title="Click to view activity details"
                  >
                    <td className="rank-num-cell">
                      <span className="rank-num">#{rank}</span>
                    </td>
                    <td>
                      <div className="admin-user-cell">
                        <span className="admin-user-avatar">{u.name.charAt(0).toUpperCase()}</span>
                        <span>
                          <span className="user-name">{u.name}</span>
                          {!!u.is_admin && <span className="admin-badge">{T.adminLabel}</span>}
                        </span>
                      </div>
                    </td>
                    <td className="email-cell col-hide-sm">{u.email}</td>
                    <td className="col-hide-sm">{u.age}</td>
                    <td>
                      <span className={`group-pill group-${u.group_num}`}>G{u.group_num}</span>
                    </td>
                    <td>
                      <div className="points-with-bar">
                        <span className="points-cell">{u.total_guruvandans.toLocaleString()}</span>
                        <div className="mini-progress" style={{ display: 'block', marginTop: 3 }}>
                          <div className="mini-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        className={`toggle-btn ${u.registration_fee_paid ? 'toggle-on' : 'toggle-off'}`}
                        onClick={(e) => toggleFee(e, u)}
                        disabled={saving[u.id + '_fee']}
                      >
                        {u.registration_fee_paid ? T.paid : T.pending}
                      </button>
                    </td>
                    <td className="col-hide-sm">
                      {showDisqualified ? (
                        <button
                          className="toggle-btn"
                          style={{ background: '#22c55e', color: '#fff', borderColor: 'transparent' }}
                          onClick={(e) => restoreDisqualified(e, u)}
                          disabled={saving[u.id + '_disq']}
                        >
                          Re-qualify
                        </button>
                      ) : (
                        <button
                          className="toggle-btn"
                          style={{ background: showDeleted ? '#22c55e' : '#ef4444', color: '#fff', borderColor: 'transparent' }}
                          onClick={(e) => toggleDelete(e, u)}
                          disabled={u.id === user.id || saving[u.id + '_delete']}
                        >
                          {showDeleted ? 'Undelete' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sorted.length === 0 && <div className="empty-state">No users found.</div>}
        </div>
      )}

      {/* User detail slide-in */}
      {selectedUserId && (
        <UserDetailPanel
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          T={T}
        />
      )}
    </div>
  );
}
