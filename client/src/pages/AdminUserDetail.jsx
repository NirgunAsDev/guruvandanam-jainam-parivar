import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';
import { Navigate } from 'react-router-dom';
import { LangContext, t } from '../lang';

const GOAL = 51000;

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
  const [expandedDates, setExpandedDates] = useState({});
  const [disqSaving, setDisqSaving] = useState(false);
  const [discardSaving, setDiscardSaving] = useState({});

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

  function toggleDate(date) {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  }

  async function handleDisqualify() {
    const newVal = !u.is_disqualified;
    const confirm = window.confirm(newVal
      ? `Disqualify ${u.name}? They will see a warning and cannot log points.`
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

  async function handleDiscardActivity(activity_id, discarded) {
    setDiscardSaving(s => ({ ...s, [activity_id]: true }));
    try {
      const res = await api.discardActivity(u.id, activity_id, discarded);
      setSummary(s => {
        const active = (s.activityBreakdown || []).filter(a => a.activity_id !== activity_id);
        const discardedList = (s.discardedActivities || []).filter(a => a.activity_id !== activity_id);
        if (discarded) {
          // Move from active to discarded
          const moved = (s.activityBreakdown || []).find(a => a.activity_id === activity_id);
          if (moved) discardedList.push(moved);
        } else {
          // Move from discarded to active
          const moved = (s.discardedActivities || []).find(a => a.activity_id === activity_id);
          if (moved) active.push(moved);
          active.sort((a, b) => b.total - a.total);
        }
        return {
          ...s,
          user: { ...s.user, total_points: res.new_total_points },
          activityBreakdown: discarded ? active : active,
          discardedActivities: discardedList,
        };
      });
    } finally {
      setDiscardSaving(s => ({ ...s, [activity_id]: false }));
    }
  }

  // Group logs by date
  const byDate = logs.reduce((acc, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {});
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  const totalPoints = summary?.user?.total_points || 0;
  const progress = Math.min(100, (totalPoints / GOAL) * 100);
  const activeDays = sortedDates.length;

  const BUMPER_IDS = ['navpad_oli','vardhman_tap','parva_pousadh','mahavir_janm_kalyanak','shasan_sthapna','bakri_eid_ayambil','mango_tyag'];
  const bumperPoints = (summary?.activityBreakdown || [])
    .filter(a => BUMPER_IDS.includes(a.activity_id))
    .reduce((sum, a) => sum + a.total, 0);

  const discardedActivities = summary?.discardedActivities || [];

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
          <div className="big-stat-value">{totalPoints.toLocaleString()}</div>
          <div className="big-stat-label">{T.totalPointsLabel}</div>
        </div>
        <div className="big-stat">
          <div className="big-stat-value">{bumperPoints.toLocaleString()}</div>
          <div className="big-stat-label">Bumper Points</div>
        </div>
        <div className="big-stat">
          <div className="big-stat-value">{Math.max(0, GOAL - totalPoints).toLocaleString()}</div>
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
          <span>{T.competitionGoal}: {totalPoints.toLocaleString()} / {GOAL.toLocaleString()} pts</span>
          <span className={`goal-status ${totalPoints >= GOAL ? 'goal-met' : ''}`}>
            {totalPoints >= GOAL ? T.goalAchieved : `${progress.toFixed(1)}${T.complete}`}
          </span>
        </div>
        <div className="progress-bar progress-bar-lg">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Top activities */}
      {summary.activityBreakdown.length > 0 && (
        <div className="section-card" style={{ marginBottom: 18 }}>
          <h2>{T.topActivities}</h2>
          <div className="activity-breakdown">
            {summary.activityBreakdown.map((a, i) => (
              <div key={a.activity_id} className="breakdown-row">
                <span className="breakdown-rank">#{i + 1}</span>
                <span className="breakdown-id">{a.activity_id.replace(/_/g, ' ')}</span>
                <span className="breakdown-days">{a.days} {T.days}</span>
                <span className="breakdown-pts">{a.total.toLocaleString()} pts</span>
                <button
                  className="btn-sm btn-danger"
                  style={{ marginLeft: 'auto', fontSize: 12 }}
                  disabled={!!discardSaving[a.activity_id]}
                  onClick={() => handleDiscardActivity(a.activity_id, true)}
                >
                  {discardSaving[a.activity_id] ? '...' : 'Discard'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discarded activities */}
      {discardedActivities.length > 0 && (
        <div className="section-card" style={{ marginBottom: 18, opacity: 0.8 }}>
          <h2 style={{ color: 'var(--color-danger, #dc2626)' }}>Discarded Activities</h2>
          <div className="activity-breakdown">
            {discardedActivities.map(a => (
              <div key={a.activity_id} className="breakdown-row breakdown-row--discarded">
                <span className="breakdown-rank" style={{ color: '#aaa' }}>✕</span>
                <span className="breakdown-id" style={{ textDecoration: 'line-through', color: '#aaa' }}>{a.activity_id.replace(/_/g, ' ')}</span>
                <span className="breakdown-days" style={{ color: '#aaa' }}>{a.days} {T.days}</span>
                <span className="breakdown-pts" style={{ color: '#aaa' }}>{a.total.toLocaleString()} pts</span>
                <button
                  className="btn-sm btn-primary"
                  style={{ marginLeft: 'auto', fontSize: 12 }}
                  disabled={!!discardSaving[a.activity_id]}
                  onClick={() => handleDiscardActivity(a.activity_id, false)}
                >
                  {discardSaving[a.activity_id] ? '...' : 'Restore'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date-wise activity log */}
      <div className="section-card">
        <h2>Date-wise Activity Log ({sortedDates.length} days)</h2>

        {sortedDates.length === 0 ? (
          <div className="empty-state">No activities logged yet.</div>
        ) : (
          <div className="datewise-list">
            {sortedDates.map(date => {
              const dayLogs = byDate[date];
              const dayTotal = dayLogs.reduce((s, l) => s + (l.is_discarded ? 0 : l.points_earned), 0);
              const isOpen = expandedDates[date];
              const isToday = date === toLocalDateStr(new Date());

              return (
                <div key={date} className={`datewise-row ${isOpen ? 'datewise-row--open' : ''}`}>
                  <button
                    className="datewise-header"
                    onClick={() => toggleDate(date)}
                  >
                    <div className="datewise-date-col">
                      <span className="datewise-date">{formatDate(date)}</span>
                      {isToday && <span className="datewise-today-tag">Today</span>}
                    </div>
                    <div className="datewise-right">
                      <span className="datewise-count">{dayLogs.length} {dayLogs.length === 1 ? 'activity' : 'activities'}</span>
                      <span className="datewise-pts">+{dayTotal.toLocaleString()} pts</span>
                      <span className="datewise-chevron">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="datewise-body">
                      {dayLogs.map((log, i) => (
                        <div key={i} className={`datewise-log-row ${log.is_discarded ? 'datewise-log-row--discarded' : ''}`}>
                          <span className="datewise-log-name" style={log.is_discarded ? { textDecoration: 'line-through', color: '#aaa' } : {}}>
                            {log.activity_id.replace(/_/g, ' ')}
                          </span>
                          {log.quantity > 1 && (
                            <span className="datewise-log-qty">× {log.quantity}</span>
                          )}
                          <span className="datewise-log-pts" style={log.is_discarded ? { color: '#aaa' } : {}}>
                            {log.is_discarded ? <s>+{log.points_earned} pts</s> : `+${log.points_earned} pts`}
                          </span>
                          {log.is_discarded && <span style={{ fontSize: 11, color: '#dc2626', marginLeft: 6 }}>discarded</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
