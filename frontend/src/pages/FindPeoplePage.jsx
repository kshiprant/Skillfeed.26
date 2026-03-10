import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PersonCard from '../components/PersonCard';
import api from '../api/client';

export default function FindPeoplePage() {
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [box, setBox] = useState({ incoming: [], sent: [], connections: [] });

  const load = async (q = '') => {
    const [{ data: users }, { data: connections }] = await Promise.all([
      api.get(`/users/discover?q=${encodeURIComponent(q)}`),
      api.get('/connections'),
    ]);
    setPeople(users);
    setBox(connections);
  };

  useEffect(() => { load(); }, []);

  const connect = async (toUser) => {
    await api.post('/connections', { toUser });
    load(query);
  };

  const act = async (id, status) => {
    await api.patch(`/connections/${id}`, { status });
    load(query);
  };

  return (
    <Layout title="Find people" subtitle="Search by skill, role, or headline.">
      <section className="card stack-form">
        <input placeholder="Search people or skills" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="primary-btn" onClick={() => load(query)}>Search</button>
      </section>

      <section className="card">
        <h3>Incoming requests</h3>
        {box.incoming.length === 0 ? <p className="muted">No incoming requests.</p> : box.incoming.map((item) => (
          <div key={item._id} className="request-row">
            <div><strong>{item.fromUser.name}</strong><p>{item.fromUser.headline}</p></div>
            <div className="row-actions">
              <button className="primary-btn" onClick={() => act(item._id, 'accepted')}>Accept</button>
              <button className="ghost-btn" onClick={() => act(item._id, 'rejected')}>Reject</button>
            </div>
          </div>
        ))}
      </section>

      <section className="stack-list">
        {people.map((person) => <PersonCard key={person._id} person={person} onConnect={connect} />)}
      </section>
    </Layout>
  );
}
