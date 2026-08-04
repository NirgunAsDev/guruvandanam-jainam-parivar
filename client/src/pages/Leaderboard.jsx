import React, { useState, useEffect, useContext } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { LangContext, t } from '../lang';

const GOAL = 51000;
const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { user } = useAuth();
  const { lang } = useContext(LangContext);
  const T = t[lang];
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.getLeaderboard().then(setUsers).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? users : users.filter(u => u.group_num === filter);
  const myRank = users.findIndex(u => u.id === user?.id) + 1;

  return (
    <div className="page-container">
      <div className="leaderboard-header">
        <div>
          <h1>{T.leaderboardTitle}</h1>
          <p>{T.leaderboardSub}</p>
        </div>
        {myRank > 0 && (
          <div className="my-rank-badge">
            {T.yourRank}: <strong>#{myRank}</strong>
          </div>
        )}
      </div>

      {!!user?.is_admin && (
        <div className="filter-row">
          {['all', '1', '2', '3'].map(g => (
            <button
              key={g}
              className={`filter-btn ${filter === g ? 'active' : ''}`}
              onClick={() => setFilter(g)}
            >
              {g === 'all' ? T.allGroups : `${T.group} ${g}`}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">{T.loading}</div>
      ) : (
        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>{T.rank}</th>
                <th>{T.name}</th>
                {!!user?.is_admin && <th>{T.group}</th>}
                <th>{T.points}</th>
                <th>{T.progress}</th>
                <th>{T.status}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const rank = users.indexOf(u) + 1;
                const pct = Math.min(100, (u.total_points / GOAL) * 100);
                const isMe = u.id === user?.id;
                const goalMet = u.total_points >= GOAL;
                return (
                  <tr key={u.id} className={isMe ? 'my-row' : ''}>
                    <td className="rank-cell">
                      {rank <= 3 ? MEDALS[rank - 1] : `#${rank}`}
                    </td>
                    <td>
                      <span className="user-name">{u.name}</span>
                      {isMe && <span className="you-badge">You</span>}
                    </td>
                    {!!user?.is_admin && (
                      <td>
                        <span className={`group-pill group-${u.group_num}`}>
                          G{u.group_num}
                        </span>
                      </td>
                    )}
                    <td className="points-cell">{u.total_points.toLocaleString()}</td>
                    <td className="progress-cell">
                      <div className="mini-progress">
                        <div className="mini-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="mini-pct">{pct.toFixed(0)}%</span>
                    </td>
                    <td>
                      {goalMet
                        ? <span className="status-badge status-goal">{T.goalMet}</span>
                        : <span className="status-badge status-ongoing">{T.inProgress}</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">No participants yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
