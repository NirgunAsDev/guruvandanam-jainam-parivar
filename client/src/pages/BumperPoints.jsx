import React, { useState, useEffect, useCallback, useContext } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { LangContext, t, BRAND } from '../lang';

export default function BumperPoints() {
  const { user, updateUserPoints } = useAuth();
  const { lang, activityLang } = useContext(LangContext);
  const T = t[lang];

  const [activities, setActivities] = useState([]);
  const [logs, setLogs] = useState({});
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [toast, setToast] = useState(null);

  function activityName(activity) {
    return (activityLang === 'hi' ? activity.nameHi : null) || activity.nameGu;
  }

  function activityDesc(activity) {
    return (activityLang === 'hi' ? activity.descriptionHi : null) || activity.description;
  }

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    api.getActivities().then(data => {
      const bumper = data.filter(a => a.group === 'bumper');
      setActivities(bumper);
      const q = {};
      bumper.forEach(a => { q[a.id] = a.unit === 'boolean' ? 1 : ''; });
      setQuantities(q);
      if (bumper.length === 0) setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!activities.length) return;
    setLoading(true);
    api.getAllLogs().then(data => {
      const map = {};
      // Only map logs for bumper activities
      data.forEach(l => {
        if (activities.some(a => a.id === l.activity_id)) {
          map[l.activity_id] = l;
        }
      });
      setLogs(map);
      const q = {};
      activities.forEach(a => {
        q[a.id] = map[a.id] ? map[a.id].quantity : (a.unit === 'boolean' ? 1 : '');
      });
      setQuantities(q);
    }).finally(() => setLoading(false));
  }, [activities.length]);

  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  async function handleToggle(activity) {
    const isLogged = !!logs[activity.id];
    setSaving(s => ({ ...s, [activity.id]: true }));
    try {
      if (isLogged) {
        const res = await api.deleteLog(logs[activity.id].id);
        setLogs(l => { const n = { ...l }; delete n[activity.id]; return n; });
        updateUserPoints(res.total_points);
        showToast(`${T.remove}: ${activityName(activity)}`, 'error');
      } else {
        const qty = activity.unit === 'boolean' ? 1 : (parseInt(quantities[activity.id]) || 1);
        const res = await api.logActivity({ activity_id: activity.id, quantity: qty, date: todayIST });
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

  async function handleCountSubmit(activity) {
    const qty = parseInt(quantities[activity.id]);
    if (!qty || qty <= 0) return;
    setSaving(s => ({ ...s, [activity.id]: true }));
    try {
      const res = await api.logActivity({ activity_id: activity.id, quantity: qty, date: todayIST });
      setLogs(l => ({ ...l, [activity.id]: res.log }));
      updateUserPoints(res.total_points);
      showToast(`+${res.log.points_earned} pts — ${activityName(activity)}`);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(s => ({ ...s, [activity.id]: false }));
    }
  }

  const unitLabel = (unit) => {
    if (unit === 'minutes') return T.minutes;
    if (unit === 'hours') return T.hours;
    return T.count;
  };

  const isUnlocked = todayIST >= BRAND.bumperUnlockDate;
  const isProgramEnded = todayIST > BRAND.competitionEnd;

  return (
    <div className="page-container">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="dashboard-header">
        <div>
          <h1>{T.bumper}</h1>
        </div>
      </div>

      {!isUnlocked && (
        <div className="bumper-locked-banner bumper-locked-banner--flash">
          {(activityLang === 'hi' ? t.hi : T).bumperLocked}
        </div>
      )}

      {isProgramEnded && (
        <div className="program-ended-banner">
          આરાધના પત્રક સમાપ્ત થઈ ગઈ છે (તા. ૩૧/૦૭/૨૦૨૬). હવે પોઈન્ટ્સ ભરી શકાશે નહિ.
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">{T.loadingActivities}</div>
      ) : activities.length === 0 ? (
        <div className="empty-state">No bumper activities available.</div>
      ) : (
        <div className="activity-grid">
          {activities.map(activity => {
            const isLogged = !!logs[activity.id];
            const isSaving = saving[activity.id];
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

                <div className="activity-actions">
                  {activity.unit !== 'boolean' && !isLogged && (
                    <div className="count-input-row">
                      <input
                        type="number"
                        className="count-input"
                        min="1"
                        value={quantities[activity.id] || ''}
                        onChange={e => setQuantities(q => ({ ...q, [activity.id]: e.target.value }))}
                        placeholder={unitLabel(activity.unit)}
                        disabled={!isUnlocked || isProgramEnded}
                      />
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => handleCountSubmit(activity)}
                        disabled={isSaving || !quantities[activity.id] || !isUnlocked || isProgramEnded}
                      >
                        {isSaving ? '...' : T.log}
                      </button>
                    </div>
                  )}
                  {activity.unit === 'boolean' && (
                    <button
                      className={`btn-full ${isLogged ? 'btn-danger' : 'btn-primary'}`}
                      onClick={() => handleToggle(activity)}
                      disabled={isSaving || !isUnlocked || isProgramEnded}
                    >
                      {isSaving ? '...' : isLogged ? T.undo : T.markDone}
                    </button>
                  )}
                  {activity.unit !== 'boolean' && isLogged && (
                    <button
                      className="btn-danger btn-full"
                      onClick={() => handleToggle(activity)}
                      disabled={isSaving || !isUnlocked || isProgramEnded}
                    >
                      {isSaving ? '...' : T.remove}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
