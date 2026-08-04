import React, { useState, useEffect, useContext } from 'react';
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
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const { activityLang } = useContext(LangContext);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getGuruvandanLogs(selectedDate).then(logs => {
      setDayCount(logs[0]?.count || 0);
    }).finally(() => setLoading(false));
  }, [selectedDate]);

  const istDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const isUnlocked = istDateStr >= BRAND.competitionStart;
  const isProgramEnded = istDateStr > BRAND.competitionEnd;
  const isEditable = !isProgramEnded && selectedDate >= getEditableCutoff();

  const totalGuruvandans = user?.total_guruvandans || 0;
  const progress = Math.min(100, (totalGuruvandans / TARGET) * 100);

  async function handleAdd() {
    const addCount = parseInt(inputValue);
    if (!addCount || addCount <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.logGuruvandan({ count: addCount, date: selectedDate });
      setDayCount(res.log.count);
      setInputValue('');
      updateUserPoints(res.total_guruvandans);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleClearDay() {
    setSaving(true);
    setError(null);
    try {
      const res = await api.deleteGuruvandanLog(selectedDate);
      setDayCount(0);
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

      {isProgramEnded && (
        <div className="program-ended-banner">
          ગુરુવંદનમ્ સમાપ્ત થઈ ગયું છે (તા. ૩૧/૧૨/૨૦૨૬). હવે ગુરુવંદન ભરી શકાશે નહિ.
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
              <div className="count-input-row">
                <input
                  type="number"
                  className="count-input"
                  min="1"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={T.enterCount}
                  disabled={saving || !isUnlocked}
                />
                <button
                  className="btn-primary btn-sm"
                  onClick={handleAdd}
                  disabled={saving || !inputValue || !isUnlocked}
                >
                  {saving ? '...' : T.log}
                </button>
              </div>
              {dayCount > 0 && (
                <button
                  className="btn-danger btn-full"
                  onClick={handleClearDay}
                  disabled={saving || !isUnlocked}
                  style={{ marginTop: 8 }}
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
    </div>
  );
}
