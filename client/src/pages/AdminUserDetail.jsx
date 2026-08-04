import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';
import { Navigate } from 'react-router-dom';
import { LangContext, t } from '../lang';

const GOAL = 1008;

function toLocalDateStr(date) {
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminUserDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useContext(LangContext);
  const T = t[lang];

  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disqSaving, setDisqSaving] = useState(false);

  useEffect(() => {
    if (!user?.is_admin) return;
    Promise.all([
      api.getUserSummary(id),
      api.getUserLogs(id),
    ]).then(([sum, logData]) => {
      setSummary(sum);
      setLogs(logData);
    }).finally(() => setLoading(false));
  }, [id, user]);

  if (!user?.is_admin) return <Navigate to="/admin-login" replace />;

  async function handleDisqualify() {
    const newVal = !u.is_disqualified;
    const confirm = window.confirm(newVal
      ? `Disqualify ${u.name}? They will see a warning and cannot log guruvandans.`
      : `Remove disqualification for ${u.name}?`
    );
    if (!confirm) return;
    setDisqSaving(true);
    try {
      await api.disqualifyUser(u.id, newVal);
      setSummary(s => ({ ...s, user: { ...s.user, is_disqualified: newVal ? 1 : 0 } }));
    } finally {
      setDisqSaving(false);
    }
  }

  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  const totalGuruvandans = summary?.user?.total_guruvandans || 0;
  const progress = Math.min(100, (totalGuruvandans / GOAL) * 100);
  const activeDays = sortedLogs.length;

  const GROUP_LABELS = { '1': T.g1label, '2': T.g2label, '3': T.g3label };

  if (loading) return (
    <div className="page-container">
      <div className="loading-spinner">{T.loading}</div>
    </div>
  );

  if (!summary) return (
    <div className="page-container">
      <div className="empty-state">User not found.</div>
    </div>
  );

  const u = summary.user;

  return (
    <div className="page-container">
      {/* Back button */}
      <button className="back-btn" onClick={() => navigate('/admin')}>
        ← {T.adminPanel}
      </button>

      {/* User header card */}
      <div className="user-detail-hero">
        <div className="user-detail-avatar">{u.name.charAt(0).toUpperCase()}</div>
        <div className="user-detail-info">
          <h1 style={{ marginBottom: 6 }}>{u.name}</h1>
          <div className="user-detail-meta-row">
            <span className={`group-pill group-${u.group_num}`}>{GROUP_LABELS[u.group_num]}</span>
            <span className="user-detail-meta">{u.email}</span>
            <span className="user-detail-meta">Age {u.age}</span>
            {u.registration_fee_paid
              ? <span className="detail-badge detail-badge--green">✓ Fee Paid</span>
              : <span className="detail-badge detail-badge--red">✕ Fee Pending</span>}
          </div>
          <div className="user-detail-meta" style={{ marginTop: 4 }}>
            Joined {u.created_at?.split('T')[0]}
          </div>
          <div style={{ marginTop: 10 }}>
            <button
              className={`btn-sm ${u.is_disqualified ? 'btn-primary' : 'btn-danger'}`}
              onClick={handleDisqualify}
              disabled={disqSaving}
            >
              {disqSaving ? '...' : u.is_disqualified ? '✓ Remove Disqualification' : '⚠ Disqualify User'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-cards" style={{ marginBottom: 18 }}>
        <div className="big-stat">
          <div className="big-stat-value">{totalGuruvandans.toLocaleString()}</div>
          <div className="big-stat-label">{T.totalGuruvandansLabel}</div>
        </div>
        <div className="big-stat">
          <div className="big-stat-value">{Math.max(0, GOAL - totalGuruvandans).toLocaleString()}</div>
          <div className="big-stat-label">{T.remainingLabel}</div>
        </div>
        <div className="big-stat">
          <div className="big-stat-value">{activeDays}</div>
          <div className="big-stat-label">{T.activeDaysLabel}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="section-card" style={{ marginBottom: 18 }}>
        <div className="progress-header">
          <span>{T.competitionGoal}: {totalGuruvandans.toLocaleString()} / {GOAL.toLocaleString()}</span>
          <span className={`goal-status ${totalGuruvandans >= GOAL ? 'goal-met' : ''}`}>
            {totalGuruvandans >= GOAL ? T.goalAchieved : `${progress.toFixed(1)}${T.complete}`}
          </span>
        </div>
        <div className="progress-bar progress-bar-lg">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Date-wise guruvandan log */}
      <div className="section-card">
        <h2>Date-wise Guruvandan Log ({sortedLogs.length} days)</h2>

        {sortedLogs.length === 0 ? (
          <div className="empty-state">No guruvandans logged yet.</div>
        ) : (
          <div className="datewise-list">
            {sortedLogs.map(log => {
              const isToday = log.date === toLocalDateStr(new Date());
              return (
                <div key={log.date} className="datewise-row">
                  <div className="datewise-header" style={{ cursor: 'default' }}>
                    <div className="datewise-date-col">
                      <span className="datewise-date">{formatDate(log.date)}</span>
                      {isToday && <span className="datewise-today-tag">Today</span>}
                    </div>
                    <div className="datewise-right">
                      <span className="datewise-pts">{log.count.toLocaleString()} guruvandans</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
