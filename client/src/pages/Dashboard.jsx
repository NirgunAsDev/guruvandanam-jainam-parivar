import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { LangContext, t, BRAND } from '../lang';
import VideoModal from '../components/VideoModal';

const TARGET = 1008;
const DAILY_MAX = 30;
const MILESTONE_FRACTIONS = [1, 0.75, 0.5, 0.25, 0];

function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getEditableCutoff() {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return toLocalDateStr(d);
}

const MIN_DATE = BRAND.competitionStart;

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Builds a fixed 42-cell (6-week) grid for the given 'YYYY-MM' month. Cells
// outside the current month are shown muted and are not clickable.
function buildMonthGrid(monthStr) {
  const [year, month1] = monthStr.split('-').map(Number);
  const month = month1 - 1;
  const firstDow = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, dateStr: null });
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
  }
  while (cells.length < 42) cells.push({ day: null, dateStr: null });
  return cells;
}

function shiftMonth(monthStr, delta) {
  const [year, month1] = monthStr.split('-').map(Number);
  const d = new Date(year, month1 - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function MonthCalendar({ selectedDate, minDate, maxDate, onSelect }) {
  const [monthStr, setMonthStr] = useState(selectedDate.slice(0, 7));
  useEffect(() => { setMonthStr(selectedDate.slice(0, 7)); }, [selectedDate]);

  const cells = useMemo(() => buildMonthGrid(monthStr), [monthStr]);
  const [year, month1] = monthStr.split('-').map(Number);
  const monthLabel = new Date(year, month1 - 1, 1).toLocaleDateString('en', { month: 'long', year: 'numeric' });
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="cal-grid-wrap">
      <div className="cal-grid-header">
        <button type="button" onClick={() => setMonthStr(m => shiftMonth(m, -1))} aria-label="Previous month">‹</button>
        <span>{monthLabel}</span>
        <button type="button" onClick={() => setMonthStr(m => shiftMonth(m, 1))} aria-label="Next month">›</button>
      </div>
      <div className="cal-grid-weekdays">
        {weekdays.map(w => <span key={w}>{w}</span>)}
      </div>
      <div className="cal-grid-days">
        {cells.map((c, i) => {
          if (!c.dateStr) return <span key={i} className="cal-day cal-day--empty" />;
          const disabled = c.dateStr < minDate || c.dateStr > maxDate;
          const isSelected = c.dateStr === selectedDate;
          return (
            <button
              type="button"
              key={i}
              className={`cal-day ${isSelected ? 'cal-day--selected' : ''}`}
              disabled={disabled}
              onClick={() => onSelect(c.dateStr)}
            >
              {c.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MiniChart({ data }) {
  if (!data.length) return <div className="mini-chart-empty">No activity logged yet</div>;
  const max = Math.max(1, ...data.map(d => d.count));
  const w = 320, h = 130, gap = 8;
  const barW = (w - gap * (data.length - 1)) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mini-chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0C842" />
          <stop offset="100%" stopColor="#D4A017" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barH = Math.max(2, (d.count / max) * (h - 24));
        const x = i * (barW + gap);
        const y = h - barH - 18;
        return (
          <g key={d.date}>
            <rect x={x} y={y} width={barW} height={barH} rx="3" fill="url(#barGrad)" />
            <text x={x + barW / 2} y={h - 4} textAnchor="middle" fontSize="9" fill="rgba(253,246,227,0.55)">
              {new Date(d.date + 'T12:00:00').getDate()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Dashboard() {
  const { user, updateUserPoints } = useAuth();
  const { lang } = useContext(LangContext);
  const T = t[lang];

  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()));
  const [dayCount, setDayCount] = useState(0);
  // Mirrors lastSyncedRef as state so the "logged/added" pill can re-render —
  // it only changes once a commit actually succeeds, not on every +/- tap.
  const [syncedCount, setSyncedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [helpVideoUrl, setHelpVideoUrl] = useState('');
  const [dailyLogs, setDailyLogs] = useState([]);
  const [toast, setToast] = useState(null);

  // Tracks the last value confirmed by the server for the currently selected
  // date, so typed/tapped edits can be sent as a delta and requests can be
  // chained in order (avoids lost updates from rapid +/- taps).
  const lastSyncedRef = useRef(0);
  const queueRef = useRef(Promise.resolve());
  const toastTimerRef = useRef(null);

  function showToast(message) {
    setToast(message);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }

  function refreshSummary() {
    api.getSummary().then(res => setDailyLogs(res.dailyLogs || [])).catch(() => {});
  }

  useEffect(() => {
    api.getLandingVideo().then(res => setHelpVideoUrl(res.landing_video_url || '')).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getGuruvandanLogs(selectedDate).then(logs => {
      const c = logs[0]?.count || 0;
      setDayCount(c);
      setSyncedCount(c);
      lastSyncedRef.current = c;
    }).finally(() => setLoading(false));
  }, [selectedDate]);

  useEffect(() => { refreshSummary(); }, []);

  const istDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const isUnlocked = istDateStr >= BRAND.competitionStart;
  const isEditable = selectedDate >= getEditableCutoff();
  const todayStr = toLocalDateStr(new Date());

  const totalGuruvandans = user?.total_guruvandans || 0;
  const progress = Math.min(100, (totalGuruvandans / TARGET) * 100);

  const remaining = Math.max(0, TARGET - totalGuruvandans);
  const goalReached = remaining === 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.max(1, Math.ceil((new Date(BRAND.competitionEnd + 'T23:59:59') - new Date(istDateStr + 'T00:00:00')) / msPerDay));
  const perDayNeeded = Math.ceil(remaining / daysLeft);
  const perWeekNeeded = Math.ceil((remaining / daysLeft) * 7);

  const milestones = MILESTONE_FRACTIONS.map(f => Math.round(TARGET * f));
  const chartData = [...dailyLogs].reverse().slice(-7);

  // Sends a delta for the date it was created for, chaining requests so rapid
  // taps resolve in order instead of racing each other. The +/- buttons only
  // adjust the on-screen count; nothing is sent to the server until this is
  // called (from the "Add Guruvandan" button or a manual-typed commit).
  function commitDelta(delta, date, { announce = false } = {}) {
    if (!delta) return;
    const prevSynced = date === selectedDate ? lastSyncedRef.current : null;
    setSaving(true);
    setError(null);
    queueRef.current = queueRef.current
      .then(() => api.logGuruvandan({ count: delta, date }))
      .then(res => {
        if (date === selectedDate) {
          lastSyncedRef.current = res.log.count;
          setSyncedCount(res.log.count);
          setDayCount(res.log.count);
        }
        updateUserPoints(res.total_guruvandans);
        refreshSummary();
        if (announce && prevSynced !== null) {
          const actualDelta = res.log.count - prevSynced;
          if (actualDelta > 0) {
            showToast(`You successfully added ${actualDelta} guruvandan${actualDelta === 1 ? '' : 's'}.`);
          } else if (actualDelta < 0) {
            showToast(`Updated — ${Math.abs(actualDelta)} guruvandan${Math.abs(actualDelta) === 1 ? '' : 's'} removed.`);
          }
        }
      })
      .catch(e => {
        setError(e.message);
        if (date === selectedDate) setDayCount(lastSyncedRef.current);
      })
      .finally(() => setSaving(false));
  }

  function handleIncrement() {
    setDayCount(c => Math.min(DAILY_MAX, c + 1));
  }
  function handleDecrement() {
    if (dayCount <= 0) return;
    setDayCount(c => Math.max(0, c - 1));
  }
  function handleAddClick() {
    const delta = dayCount - lastSyncedRef.current;
    commitDelta(delta, selectedDate, { announce: true });
  }
  function handleManualChange(e) {
    const v = e.target.value;
    setDayCount(v === '' ? 0 : Math.min(DAILY_MAX, Math.max(0, parseInt(v) || 0)));
  }
  function handleManualCommit() {
    const delta = dayCount - lastSyncedRef.current;
    commitDelta(delta, selectedDate, { announce: true });
  }

  async function handleClearDay() {
    setSaving(true);
    setError(null);
    try {
      const res = await api.deleteGuruvandanLog(selectedDate);
      setDayCount(0);
      setSyncedCount(0);
      lastSyncedRef.current = 0;
      updateUserPoints(res.total_guruvandans);
      refreshSummary();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container dash-immersive">
     <div className="dash-stage">
      <div className="dash-hero">
        <h1>{T.guruvandanCounter}</h1>
        <p>{T.hello}, <strong>{user?.name}</strong></p>
      </div>

      <VideoModal isOpen={showVideo} onClose={() => setShowVideo(false)} videoUrl={helpVideoUrl} />

      {!isUnlocked && (
        <div className="bumper-locked-banner">
          {T.dashLocked}
        </div>
      )}

      <div className="dash-grid">
        {/* LEFT COLUMN */}
        <div className="dash-col">
          <div className="dash-panel milestone-panel">
            <div className="milestone-top-badge">{TARGET} Guruvandan</div>
            <div className="milestone-track">
              <div className="milestone-track-line">
                <div className="milestone-track-fill" style={{ height: `${progress}%` }} />
              </div>
              <div className="milestone-current-marker" style={{ bottom: `${progress}%` }} title={`${totalGuruvandans} Guruvandan`}>
                <span className="milestone-current-marker-count">{totalGuruvandans}</span>
              </div>
              {milestones.map((m, i) => {
                const reached = totalGuruvandans >= m;
                const side = i % 2 === 0 ? 'right' : 'left';
                const top = (i / (milestones.length - 1)) * 100;
                return (
                  <div key={m} className="milestone-row" style={{ top: `${top}%` }}>
                    <div className="milestone-badge-slot milestone-badge-slot--left">
                      {side === 'left' && (
                        <span className="milestone-badge-wrap">
                          <span className="milestone-badge">{m === 0 ? 'Start' : `${m} Guruvandan`}</span>
                          <span className="milestone-tick" />
                        </span>
                      )}
                    </div>
                    <span className={`milestone-dot ${reached ? 'milestone-dot--reached' : ''}`} />
                    <div className="milestone-badge-slot milestone-badge-slot--right">
                      {side === 'right' && (
                        <span className="milestone-badge-wrap">
                          <span className="milestone-tick" />
                          <span className="milestone-badge">{m === 0 ? 'Start' : `${m} Guruvandan`}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dash-panel progress-panel">
            <div className="progress-header">
              <span>{T.progressGoal}</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="dash-panel counter-panel">
            <h3 className="dash-panel-title">Counter Logging Tool</h3>

            {error && <div className="dash-error">{error}</div>}
            {toast && <div className="dash-toast">{toast}</div>}

            {loading ? (
              <div className="loading-spinner">{T.loadingActivities}</div>
            ) : isEditable ? (
              <>
                <div className="logged-pill">{syncedCount} {T.guruvandansLogged}</div>
                <div className="counter-stepper">
                  <input
                    type="number"
                    className="counter-value-input"
                    min="0"
                    max={DAILY_MAX}
                    value={dayCount}
                    onChange={handleManualChange}
                    onBlur={handleManualCommit}
                    onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                    disabled={!isUnlocked}
                  />
                  <div className="counter-btn-row">
                    <button
                      type="button"
                      className="counter-btn counter-btn--minus"
                      onClick={handleDecrement}
                      disabled={!isUnlocked || dayCount <= 0}
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className="counter-btn counter-btn--plus"
                      onClick={handleIncrement}
                      disabled={!isUnlocked || dayCount >= DAILY_MAX}
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                </div>
                {dayCount >= DAILY_MAX && (
                  <div className="dash-cap-notice">Maximum {DAILY_MAX} guruvandan per day.</div>
                )}
                <button
                  type="button"
                  className="btn-primary dash-add-btn"
                  onClick={handleAddClick}
                  disabled={!isUnlocked || saving || dayCount === syncedCount}
                >
                  {saving ? '...' : 'Add Guruvandan'}
                </button>
                {syncedCount > 0 && (
                  <button className="dash-clear-link" onClick={handleClearDay} disabled={saving || !isUnlocked}>
                    {saving ? '...' : T.remove}
                  </button>
                )}
                <MonthCalendar
                  selectedDate={selectedDate}
                  minDate={MIN_DATE}
                  maxDate={todayStr}
                  onSelect={setSelectedDate}
                />
              </>
            ) : (
              <div className="readonly-notice">{T.readonlyNotice}</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="dash-col">
          <div className="dash-panel feed-panel">
            <h3 className="dash-panel-title">Daily Activity Feed</h3>
            <div className="feed-list">
              {dailyLogs.slice(0, 5).map((log, i) => (
                <div key={log.date} className={`feed-item ${i === 0 ? 'feed-item--active' : ''}`}>
                  <span className="feed-dot" />
                  <span className="feed-text">
                    {new Date(log.date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}: {log.count} Guruvandans
                  </span>
                </div>
              ))}
              {dailyLogs.length === 0 && <div className="feed-empty">No activity yet</div>}
            </div>
          </div>

          {helpVideoUrl && (
            <div className="video-preview-banner" onClick={() => setShowVideo(true)}>
              <div className="video-play-circle">▶</div>
              <div className="video-preview-text">
                <div className="video-preview-label">Help Video — {BRAND.nameHi}</div>
                <div className="video-preview-sub">सहायता वीडियो</div>
              </div>
              <div className="video-preview-arrow">›</div>
            </div>
          )}

          <div className="dash-panel analytics-panel">
            <h3 className="dash-panel-title">Detailed Analytics</h3>
            <MiniChart data={chartData} />

            {goalReached ? (
              <div className="pace-achieved">🎉 {T.goalAchievedShort}</div>
            ) : (
              <div className="pace-grid">
                <div className="pace-card">
                  <div className="pace-value">{daysLeft}</div>
                  <div className="pace-label">{T.daysLeftLabel}</div>
                </div>
                <div className="pace-card">
                  <div className="pace-value">{perDayNeeded}</div>
                  <div className="pace-label">{T.perDayLabel}</div>
                </div>
                <div className="pace-card">
                  <div className="pace-value">{perWeekNeeded}</div>
                  <div className="pace-label">{T.perWeekLabel}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
     </div>
    </div>
  );
}
