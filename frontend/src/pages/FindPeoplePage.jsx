import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import PersonCard from '../components/PersonCard';
import api from '../api/client';

export default function FindPeoplePage() {
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [box, setBox] = useState({ incoming: [], sent: [], connections: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  const load = async (q = '') => {
    try {
      setLoading(true);
      setError('');

      const [{ data: users }, { data: connections }] = await Promise.all([
        api.get(`/users/discover?q=${encodeURIComponent(q)}`),
        api.get('/connections'),
      ]);

      setPeople(Array.isArray(users) ? users : []);
      setBox(
        connections || { incoming: [], sent: [], connections: [] }
      );
    } catch (err) {
      console.error('Failed to load people page:', err);
      setError(err.response?.data?.message || 'Failed to load people.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sentIds = useMemo(
    () => new Set((box.sent || []).map((item) => String(item.toUser?._id))),
    [box.sent]
  );

  const incomingIds = useMemo(
    () => new Set((box.incoming || []).map((item) => String(item.fromUser?._id))),
    [box.incoming]
  );

  const connectedIds = useMemo(
    () => new Set((box.connections || []).map((item) => String(item.user?._id))),
    [box.connections]
  );

  const peopleWithStatus = useMemo(() => {
    return (people || []).map((person) => {
      const id = String(person._id);

      let connectionStatus = 'none';

      if (connectedIds.has(id)) {
        connectionStatus = 'accepted';
      } else if (sentIds.has(id)) {
        connectionStatus = 'sent';
      } else if (incomingIds.has(id)) {
        connectionStatus = 'incoming';
      }

      return {
        ...person,
        connectionStatus,
      };
    });
  }, [people, connectedIds, sentIds, incomingIds]);

  const connect = async (toUser) => {
    try {
      setActionLoading(String(toUser));
      setError('');
      await api.post('/connections', { toUser });
      await load(query);
    } catch (err) {
      console.error('Failed to send connection request:', err);
      setError(err.response?.data?.message || 'Failed to send connection request.');
    } finally {
      setActionLoading('');
    }
  };

  const act = async (id, status) => {
    try {
      setActionLoading(String(id));
      setError('');
      await api.patch(`/connections/${id}`, { status });
      await load(query);
    } catch (err) {
      console.error('Failed to update request:', err);
      setError(err.response?.data?.message || 'Failed to update request.');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <Layout title="Find people" subtitle="Search by skill, role, or headline.">
      <section className="card stack-form">
        <input
          placeholder="Search people or skills"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="primary-btn" onClick={() => load(query)} disabled={loading}>
          {loading ? 'Loading...' : 'Search'}
        </button>
        {error ? <div className="error-box">{error}</div> : null}
      </section>

      <section className="card">
        <h3>Incoming requests</h3>

        {box.incoming.length === 0 ? (
          <p className="muted">No incoming requests.</p>
        ) : (
          box.incoming.map((item) => (
            <div key={item._id} className="request-row">
              <div>
                <strong>{item.fromUser.name}</strong>
                <p className="muted">{item.fromUser.headline || 'No headline added yet'}</p>
              </div>

              <div className="row-actions">
                <button
                  className="primary-btn"
                  onClick={() => act(item._id, 'accepted')}
                  disabled={actionLoading === String(item._id)}
                >
                  Accept
                </button>
                <button
                  className="ghost-btn"
                  onClick={() => act(item._id, 'rejected')}
                  disabled={actionLoading === String(item._id)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="stack-list">
        {peopleWithStatus.length === 0 ? (
          <section className="card empty-state">
            <div className="empty-state-block">
              <h3>No people found</h3>
              <p>Try a different search term.</p>
            </div>
          </section>
        ) : (
          peopleWithStatus.map((person) => (
            <PersonCard
              key={person._id}
              person={person}
              onConnect={connect}
              busy={actionLoading === String(person._id)}
            />
          ))
        )}
      </section>
    </Layout>
  );
}
