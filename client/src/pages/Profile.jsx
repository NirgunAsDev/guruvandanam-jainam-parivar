import React, { useState, useEffect, useContext } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { LangContext, t } from '../lang';

const GOAL = 1008;

export default function Profile() {
  const { user } = useAuth();
  const { lang } = useContext(LangContext);
  const T = t[lang];
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSummary().then(setSummary).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container"><div className="loading-spinner">{T.loading}</div></div>;

  const totalGuruvandans = user?.total_guruvandans || 0;
  const progress = Math.min(100, (totalGuruvandans / GOAL) * 100);
  const remaining = Math.max(0, GOAL - totalGuruvandans);

  return (
    <div className="page-container">
      <h1>{T.myProgressTitle}</h1>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="profile-name">{user?.name}</div>
          <div className="profile-meta">{user?.email}</div>
          <div className="profile-meta">{user?.age} yrs</div>
          {(user?.city || user?.state) && (
            <div className="profile-meta">{[user.city, user.state].filter(Boolean).join(', ')}</div>
          )}
        </div>

        <div className="stats-cards">
          <div className="big-stat">
            <div className="big-stat-value">{totalGuruvandans.toLocaleString()}</div>
            <div className="big-stat-label">{T.totalGuruvandansLabel}</div>
          </div>
          <div className="big-stat">
            <div className="big-stat-value">{remaining.toLocaleString()}</div>
            <div className="big-stat-label">{T.remainingLabel}</div>
          </div>
          <div className="big-stat">
            <div className="big-stat-value">{summary?.dailyLogs?.length || 0}</div>
            <div className="big-stat-label">{T.activeDaysLabel}</div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <h2>{T.competitionGoal}</h2>
        <div className="progress-header">
          <span>{totalGuruvandans.toLocaleString()} / {GOAL.toLocaleString()}</span>
          <span className={`goal-status ${totalGuruvandans >= GOAL ? 'goal-met' : ''}`}>
            {totalGuruvandans >= GOAL ? T.goalAchieved : `${progress.toFixed(1)}${T.complete}`}
          </span>
        </div>
        <div className="progress-bar progress-bar-lg">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="prize-info">
          <div className="prize-item">🥇 1st Prize: ₹21,000</div>
          <div className="prize-item">🥈 2nd Prize: ₹11,000</div>
          <div className="prize-item">🥉 3rd Prize: ₹5,000</div>
        </div>
      </div>

      {summary?.dailyLogs?.length > 0 && (
        <div className="section-card">
          <h2>{T.recentActivity}</h2>
          <div className="daily-chart">
            {summary.dailyLogs.slice(0, 14).reverse().map(d => {
              const pct = Math.min(100, (d.count / 20) * 100);
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
        </div>
      )}
    </div>
  );
}
