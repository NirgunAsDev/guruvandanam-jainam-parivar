import React, { useState, useEffect, useContext, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { LangContext, t, BRAND } from '../lang';
import VideoModal from '../components/VideoModal';

const TARGET = 1008;

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

function DateNav({ selectedDate, onSelect }) {
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

  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()));
  const [dayCount, setDayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const { activityLang } = useContext(LangContext);

  // Tracks the last value confirmed by the server for the currently selected
  // date, so typed/tapped edits can be sent as a delta and requests can be
  // chained in order (avoids lost updates from rapid +/- taps).
  const lastSyncedRef = useRef(0);
  const queueRef = useRef(Promise.resolve());

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getGuruvandanLogs(selectedDate).then(logs => {
      const c = logs[0]?.count || 0;
      setDayCount(c);
      lastSyncedRef.current = c;
    }).finally(() => setLoading(false));
  }, [selectedDate]);

  const istDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const isUnlocked = istDateStr >= BRAND.competitionStart;
  const isEditable = selectedDate >= getEditableCutoff();

  const totalGuruvandans = user?.total_guruvandans || 0;
  const progress = Math.min(100, (totalGuruvandans / TARGET) * 100);

  const remaining = Math.max(0, TARGET - totalGuruvandans);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.max(1, Math.ceil((new Date(BRAND.competitionEnd + 'T23:59:59') - new Date(istDateStr + 'T00:00:00')) / msPerDay));
  const perDayNeeded = remaining > 0 ? Math.ceil(remaining / daysLeft) : 0;
  const perWeekNeeded = perDayNeeded * 7;

  // Sends a delta for the date it was created for, chaining requests so rapid
  // taps resolve in order instead of racing each other.
  function commitDelta(delta, date) {
    if (!delta) return;
    setSaving(true);
    setError(null);
    queueRef.current = queueRef.current
      .then(() => api.logGuruvandan({ count: delta, date }))
      .then(res => {
        if (date === selectedDate) {
          lastSyncedRef.current = res.log.count;
          setDayCount(res.log.count);
        }
        updateUserPoints(res.total_guruvandans);
      })
      .catch(e => {
        setError(e.message);
        if (date === selectedDate) setDayCount(lastSyncedRef.current);
      })
      .finally(() => setSaving(false));
  }

  function handleIncrement() {
    const date = selectedDate;
    setDayCount(c => c + 1);
    commitDelta(1, date);
  }
  function handleDecrement() {
    if (dayCount <= 0) return;
    const date = selectedDate;
    setDayCount(c => Math.max(0, c - 1));
    commitDelta(-1, date);
  }
  function handleManualChange(e) {
    const v = e.target.value;
    setDayCount(v === '' ? 0 : Math.max(0, parseInt(v) || 0));
  }
  function handleManualCommit() {
    const delta = dayCount - lastSyncedRef.current;
    commitDelta(delta, selectedDate);
  }

  async function handleClearDay() {
    setSaving(true);
    setError(null);
    try {
      const res = await api.deleteGuruvandanLog(selectedDate);
      setDayCount(0);
      lastSyncedRef.current = 0;
      updateUserPoints(res.total_guruvandans);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>{T.guruvandanCounter}</h1>
          <p>{T.hello}, <strong>{user?.name}</strong></p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-value">{totalGuruvandans.toLocaleString()}</div>
            <div className="stat-label">{T.totalGuruvandans}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{dayCount.toLocaleString()}</div>
            <div className="stat-label">{T.dayGuruvandans}</div>
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
          <div className="video-preview-label">Help Video — ગુરુવંદનમ્</div>
          <div className="video-preview-sub">सहायता वीडियो / મદદ વિડિઓ</div>
        </div>
        <div className="video-preview-arrow">›</div>
      </div>

      {!isUnlocked && (
        <div className="bumper-locked-banner">
          {(activityLang === 'hi' ? t.hi : T).dashLocked}
        </div>
      )}

      {/* Date Navigator */}
      <DateNav selectedDate={selectedDate} onSelect={setSelectedDate} />

      {/* Counter */}
      {loading ? (
        <div className="loading-spinner">{T.loadingActivities}</div>
      ) : (
        <div className="activity-card">
          <div className="activity-card-header">
            <div className="activity-name">{T.guruvandansOn} {selectedDate}</div>
          </div>

          <div className="logged-badge">
            {dayCount} {T.guruvandansLogged}
          </div>

          {error && <div style={{ color: 'var(--danger, #ef4444)', fontSize: 13, marginBottom: 8 }}>{error}</div>}

          {isEditable ? (
            <div className="activity-actions">
              <div className="counter-stepper">
                <input
                  type="number"
                  className="counter-value-input"
                  min="0"
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
                    disabled={!isUnlocked}
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
              </div>
              {dayCount > 0 && (
                <button
                  className="btn-danger btn-full"
                  onClick={handleClearDay}
                  disabled={saving || !isUnlocked}
                  style={{ marginTop: 12 }}
                >
                  {saving ? '...' : T.remove}
                </button>
              )}
            </div>
          ) : (
            <div className="readonly-notice">🔒 જૂની તારીખ — ફક્ત જોવા માટે</div>
          )}
        </div>
      )}

      {/* Pace to target */}
      <div className="pace-grid">
        <div className="pace-card">
          <div className="pace-value">{daysLeft}</div>
          <div className="pace-label">{T.daysLeftLabel}</div>
        </div>
        <div className={`pace-card ${remaining === 0 ? 'pace-card--done' : ''}`}>
          <div className="pace-value">{remaining === 0 ? '✓' : perDayNeeded}</div>
          <div className="pace-label">{T.perDayLabel}</div>
        </div>
        <div className={`pace-card ${remaining === 0 ? 'pace-card--done' : ''}`}>
          <div className="pace-value">{remaining === 0 ? '✓' : perWeekNeeded}</div>
          <div className="pace-label">{T.perWeekLabel}</div>
        </div>
      </div>
    </div>
  );
}
