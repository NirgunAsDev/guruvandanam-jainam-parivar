import React, { useState, useEffect, useCallback, useContext } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { LangContext, t, BRAND } from '../lang';
import VideoModal from '../components/VideoModal';

function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildRecentDays(n = 4) {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (n - 1 - i));
    return toLocalDateStr(d);
  });
}

function getEditableCutoff() {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return toLocalDateStr(d);
}

const MIN_DATE = BRAND.competitionStart;

function DateNav({ selectedDate, onSelect, T }) {
  const recentDays = buildRecentDays(3).filter(d => d >= MIN_DATE);
  const todayStr = toLocalDateStr(new Date());
  const isRecent = recentDays.includes(selectedDate);

  function dayLabel(dateStr) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' });
  }
  function dayNum(dateStr) {
    return new Date(dateStr + 'T12:00:00').getDate();
  }
  function monthShort(dateStr) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en', { month: 'short' });
  }

  return (
    <div className="date-nav">
      <div className="date-pills">
        {recentDays.map((d) => {
          const isActive = selectedDate === d;
          return (
            <button
              key={d}
              className={`date-pill ${isActive ? 'date-pill--active' : ''}`}
              onClick={() => onSelect(d)}
            >
              <span className="date-pill-weekday">{dayLabel(d)}</span>
              <span className="date-pill-num">{dayNum(d)}</span>
              <span className="date-pill-month">{monthShort(d)}</span>
              {d === todayStr && <span className="date-pill-today-dot" />}
            </button>
          );
        })}

        {/* Calendar pill: label wraps a transparent date input so clicking opens native picker directly */}
        <label className={`date-pill date-pill--cal ${!isRecent ? 'date-pill--active' : ''}`}>
          <span className="date-pill-weekday">{!isRecent ? dayLabel(selectedDate) : ''}</span>
          <span className="date-pill-num">📅</span>
          <span className="date-pill-month">
            {!isRecent ? `${dayNum(selectedDate)} ${monthShort(selectedDate)}` : 'More'}
          </span>
          <input
            type="date"
            className="date-cal-hidden"
            value={selectedDate}
            min={MIN_DATE}
            max={todayStr}
            onChange={e => { if (e.target.value >= MIN_DATE) onSelect(e.target.value); }}
          />
        </label>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, updateUserPoints } = useAuth();
  const { lang } = useContext(LangContext);
  const T = t[lang];

  const [activities, setActivities] = useState([]);
  const [logs, setLogs] = useState({});
  const [quantities, setQuantities] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [toast, setToast] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const { activityLang } = useContext(LangContext);

  function activityName(activity) {
    return (activityLang === 'hi' ? activity.nameHi : null) || activity.nameGu;
  }

  function activityDesc(activity) {
    return (activityLang === 'hi' ? activity.descriptionHi : null) || activity.description;
  }

  function optionLabel(opt) {
    return (activityLang === 'hi' ? opt.labelHi : null) || opt.label;
  }

  const GROUP_LABELS = {
    '1': T.group1, '2': T.group2, '3': T.group3,
    common: T.common, bumper: T.bumper,
  };

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    api.getActivities().then(data => {
      setActivities(data);
      const q = {};
      data.forEach(a => { q[a.id] = a.unit === 'boolean' ? 1 : ''; });
      setQuantities(q);
    });
  }, []);

  useEffect(() => {
    if (!activities.length) return;
    setLoading(true);
    api.getLogs(selectedDate).then(data => {
      const map = {};
      data.forEach(l => { map[l.activity_id] = l; });
      setLogs(map);
      const q = {};
      const opts = {};
      activities.forEach(a => {
        if (a.unit === 'select') {
          if (map[a.id]) opts[a.id] = map[a.id].quantity;
        } else {
          q[a.id] = map[a.id] ? map[a.id].quantity : (a.unit === 'boolean' ? 1 : '');
        }
      });
      setQuantities(q);
      setSelectedOptions(opts);
    }).finally(() => setLoading(false));
  }, [selectedDate, activities.length]);

  async function handleToggle(activity) {
    const isLogged = !!logs[activity.id];
    setSaving(s => ({ ...s, [activity.id]: true }));
    try {
      if (isLogged) {
        const res = await api.deleteLog(logs[activity.id].id);
        setLogs(l => { const n = { ...l }; delete n[activity.id]; return n; });
        if (activity.unit === 'select') {
          setSelectedOptions(o => { const n = { ...o }; delete n[activity.id]; return n; });
        }
        updateUserPoints(res.total_points);
        showToast(`${T.remove}: ${activityName(activity)}`, 'error');
      } else {
        const qty = activity.unit === 'boolean' ? 1 : (parseInt(quantities[activity.id]) || 1);
        const res = await api.logActivity({ activity_id: activity.id, quantity: qty, date: selectedDate });
        setLogs(l => ({ ...l, [activity.id]: res.log }));
        updateUserPoints(res.total_points);
        showToast(`+${res.log.points_earned} pts — ${activityName(activity)}`);
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(s => ({ ...s, [activity.id]: false }));
    }
  }

  async function handleSelectLog(activity, optionIndex) {
    if (optionIndex === null || optionIndex === undefined) return;
    setSaving(s => ({ ...s, [activity.id]: true }));
    try {
      const res = await api.logActivity({ activity_id: activity.id, quantity: optionIndex, date: selectedDate });
      setLogs(l => ({ ...l, [activity.id]: res.log }));
      setSelectedOptions(o => ({ ...o, [activity.id]: optionIndex }));
      updateUserPoints(res.total_points);
      const optLabel = activity.options[optionIndex]?.label || '';
      showToast(`+${res.log.points_earned} pts — ${activityName(activity)} (${optLabel})`);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(s => ({ ...s, [activity.id]: false }));
    }
  }

  async function handleCountSubmit(activity) {
    const qty = parseInt(quantities[activity.id]);
    if (!qty || qty <= 0) return;
    setSaving(s => ({ ...s, [activity.id]: true }));
    try {
      const res = await api.logActivity({ activity_id: activity.id, quantity: qty, date: selectedDate });
      setLogs(l => ({ ...l, [activity.id]: res.log }));
      updateUserPoints(res.total_points);
      showToast(`+${res.log.points_earned} pts — ${activityName(activity)}`);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(s => ({ ...s, [activity.id]: false }));
    }
  }

  const istDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const isUnlocked = istDateStr >= BRAND.competitionStart;
  const isProgramEnded = istDateStr > BRAND.competitionEnd;
  const isEditable = !isProgramEnded && selectedDate >= getEditableCutoff();

  const todayPoints = Object.values(logs).reduce((sum, l) => sum + l.points_earned, 0);
  const GOAL = 51000;
  const progress = Math.min(100, ((user?.total_points || 0) / GOAL) * 100);

  const grouped = activities.reduce((acc, a) => {
    if (!acc[a.group]) acc[a.group] = [];
    acc[a.group].push(a);
    return acc;
  }, {});

  const groupOrder = ['common', user?.group_num].filter(Boolean);

  const unitLabel = (unit) => {
    if (unit === 'minutes') return T.minutes;
    if (unit === 'hours') return T.hours;
    return T.count;
  };

  return (
    <div className="page-container">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>{T.dailyActivities}</h1>
          <p>{T.hello}, <strong>{user?.name}</strong></p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-value">{(user?.total_points || 0).toLocaleString()}</div>
            <div className="stat-label">{T.totalPoints}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{todayPoints.toLocaleString()}</div>
            <div className="stat-label">{T.todayPoints}</div>
          </div>
        </div>
      </div>
      <VideoModal isOpen={showVideo} onClose={() => setShowVideo(false)} />

      {/* Progress */}
      <div className="progress-section">
        <div className="progress-header">
          <span>{T.progressGoal}</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="video-preview-banner" onClick={() => setShowVideo(true)}>
        <div className="video-play-circle">▶</div>
        <div className="video-preview-text">
          <div className="video-preview-label">Help Video — આરાધના પત્રક</div>
          <div className="video-preview-sub">सहायता वीडियो / મદદ વિડિઓ</div>
        </div>
        <div className="video-preview-arrow">›</div>
      </div>

      {!isUnlocked && (
        <div className="bumper-locked-banner bumper-locked-banner--flash">
          {(activityLang === 'hi' ? t.hi : T).dashLocked}
        </div>
      )}

      {isProgramEnded && (
        <div className="program-ended-banner">
          આરાધના પત્રક સમાપ્ત થઈ ગઈ છે (તા. ૩૧/૦૭/૨૦૨૬). હવે પોઈન્ટ્સ ભરી શકાશે નહિ.
        </div>
      )}

      {/* Date Navigator */}
      <DateNav selectedDate={selectedDate} onSelect={setSelectedDate} T={T} />

      {/* Activities */}
      {loading ? (
        <div className="loading-spinner">{T.loadingActivities}</div>
      ) : (
        groupOrder.map(groupKey => {
          const items = grouped[groupKey];
          if (!items) return null;
          return (
            <div key={groupKey} className="activity-group">
              <div className="activity-grid">
                {items.map(activity => {
                  const isLogged = !!logs[activity.id];
                  const isSaving = saving[activity.id];

                  // ── Select (radio) activity ──────────────────────────────
                  if (activity.unit === 'select') {
                    const selectedOpt = selectedOptions[activity.id] ?? null;
                    const loggedOption = isLogged ? activity.options[logs[activity.id].quantity] : null;
                    return (
                      <div key={activity.id} className={`activity-card ${isLogged ? 'logged' : ''}`}>
                        <div className="activity-card-header">
                          <div className="activity-name">{activityName(activity)}</div>
                          {isLogged && loggedOption && (
                            <div className="activity-points-badge">{loggedOption.points} pts</div>
                          )}
                        </div>

                        {isLogged && (
                          <div className="logged-badge">
                            ✓ +{logs[activity.id].points_earned} pts {T.logged}
                            {loggedOption && ` — ${optionLabel(loggedOption)}`}
                          </div>
                        )}

                        {isEditable ? (
                          <div className="activity-actions">
                            {!isLogged && (
                              <div className="select-options">
                                <select
                                  className="select-dropdown"
                                  value={selectedOpt ?? ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setSelectedOptions(o => ({ ...o, [activity.id]: val === '' ? null : Number(val) }));
                                  }}
                                >
                                  <option value="">{activityLang === 'hi' ? '— प्रकार चुनें —' : '— પ્રકાર પસંદ કરો —'}</option>
                                  {activity.options.map((opt, idx) => (
                                    <option key={idx} value={idx}>
                                      {optionLabel(opt)} — {opt.points} pts
                                    </option>
                                  ))}
                                </select>
                                <button
                                  className="btn-primary btn-full"
                                  onClick={() => handleSelectLog(activity, selectedOpt)}
                                  disabled={isSaving || selectedOpt === null || !isUnlocked}
                                >
                                  {isSaving ? '...' : T.log}
                                </button>
                              </div>
                            )}
                            {isLogged && (
                              <button
                                className="btn-danger btn-full"
                                onClick={() => handleToggle(activity)}
                                disabled={isSaving || !isUnlocked}
                              >
                                {isSaving ? '...' : T.remove}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="readonly-notice">🔒 જૂની તારીખ — ફક્ત જોવા માટે</div>
                        )}
                      </div>
                    );
                  }

                  // ── Boolean / Count / Minutes / Hours activity ───────────
                  return (
                    <div key={activity.id} className={`activity-card ${isLogged ? 'logged' : ''}`}>
                      <div className="activity-card-header">
                        <div>
                          <div className="activity-name">{activityName(activity)}</div>
                        </div>
                        <div className="activity-points-badge">
                          {activity.unit === 'boolean'
                            ? `${activity.pointsPerUnit} pts`
                            : `${activity.pointsPerUnit} pts/${activity.unit}`}
                        </div>
                      </div>
                      <div className="activity-desc">{activityDesc(activity)}</div>

                      {isLogged && (
                        <div className="logged-badge">
                          ✓ +{logs[activity.id].points_earned} pts {T.logged}
                          {activity.unit !== 'boolean' && ` (${T.qty}: ${logs[activity.id].quantity})`}
                        </div>
                      )}

                      {isEditable ? (
                        <div className="activity-actions">
                          {activity.unit !== 'boolean' && !isLogged && (
                            <div className="count-input-row">
                              <input
                                type="number"
                                className="count-input"
                                min="0"
                                max={activity.maxPerDay}
                                value={quantities[activity.id] || ''}
                                onChange={e => {
                                  const raw = parseInt(e.target.value) || '';
                                  const clamped = raw !== '' ? Math.min(raw, activity.maxPerDay) : '';
                                  setQuantities(q => ({ ...q, [activity.id]: clamped }));
                                }}
                                placeholder={`${unitLabel(activity.unit)} (max ${activity.maxPerDay})`}
                              />
                              <button
                                className="btn-primary btn-sm"
                                onClick={() => handleCountSubmit(activity)}
                                disabled={isSaving || !quantities[activity.id] || !isUnlocked}
                              >
                                {isSaving ? '...' : T.log}
                              </button>
                            </div>
                          )}
                          {activity.unit === 'boolean' && (
                            <button
                              className={`btn-full ${isLogged ? 'btn-danger' : 'btn-primary'}`}
                              onClick={() => handleToggle(activity)}
                              disabled={isSaving || !isUnlocked}
                            >
                              {isSaving ? '...' : isLogged ? T.undo : T.markDone}
                            </button>
                          )}
                          {activity.unit !== 'boolean' && isLogged && (
                            <button
                              className="btn-danger btn-full"
                              onClick={() => handleToggle(activity)}
                              disabled={isSaving || !isUnlocked}
                            >
                              {isSaving ? '...' : T.remove}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="readonly-notice">🔒 જૂની તારીખ — ફક્ત જોવા માટે</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
