import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import api from '../api/client';

export default function FeedPage() {
  const [stats, setStats] = useState({ ideas: 0, incoming: 0, connections: 0 });

  useEffect(() => {
    const load = async () => {
      const [{ data: ideas }, { data: connectionData }] = await Promise.all([
        api.get('/ideas'),
        api.get('/connections'),
      ]);
      setStats({ ideas: ideas.length, incoming: connectionData.incoming.length, connections: connectionData.connections.length });
    };
    load();
  }, []);

  return (
    <Layout title="Build startups with the right people" subtitle="A mobile-first collaboration platform that can later be wrapped as an app.">
      <section className="grid-cards">
        <StatCard label="Live ideas" value={stats.ideas} />
        <StatCard label="Incoming requests" value={stats.incoming} />
        <StatCard label="Connections" value={stats.connections} />
      </section>
      <section className="card hero-card">
        <h2>What works in this build</h2>
        <ul>
          <li>JWT auth with MongoDB</li>
          <li>Profile creation and editing</li>
          <li>Connection requests and accepted connections</li>
          <li>Idea posting, likes, comments</li>
          <li>Messaging only for accepted connections</li>
          <li>Persistent mobile navigation</li>
        </ul>
      </section>
    </Layout>
  );
}
