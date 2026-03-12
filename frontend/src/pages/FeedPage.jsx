import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import api from '../api/client';

export default function FeedPage() {
  const [stats, setStats] = useState({ ideas: 0, incoming: 0, connections: 0 });
  const [recentIdeas, setRecentIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: ideas }, { data: connectionData }] = await Promise.all([
          api.get('/ideas'),
          api.get('/connections'),
        ]);

        const safeIdeas = Array.isArray(ideas) ? ideas : [];
        const safeIncoming = Array.isArray(connectionData?.incoming) ? connectionData.incoming : [];
        const safeConnections = Array.isArray(connectionData?.connections) ? connectionData.connections : [];

        setStats({
          ideas: safeIdeas.length,
          incoming: safeIncoming.length,
          connections: safeConnections.length,
        });

        setRecentIdeas(safeIdeas.slice(0, 5));
      } catch (error) {
        console.error('Failed to load feed data:', error);
        setStats({ ideas: 0, incoming: 0, connections: 0 });
        setRecentIdeas([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const getIdeaTitle = (idea) =>
    idea?.title || idea?.ideaTitle || 'Untitled idea';

  const getIdeaText = (idea) =>
    idea?.summary || idea?.description || idea?.content || 'No description added yet.';

  const getAuthorName = (idea) =>
    idea?.user?.name || idea?.author?.name || idea?.createdBy?.name || 'Anonymous';

  return (
    <Layout
      title="Build startups with the right people"
      subtitle="Discover ideas, connect with collaborators, and start building."
    >
      <section className="grid-cards">
        <StatCard
          label="Live ideas"
          value={stats.ideas}
          hint="Projects on your radar"
        />
        <StatCard
          label="Incoming requests"
          value={stats.incoming}
          hint="People waiting for response"
        />
        <StatCard
          label="Connections"
          value={stats.connections}
          hint="Your current network"
        />
      </section>

      <section className="card hero-card">
        <div className="section-head">
          <div>
            <h2>Recent ideas</h2>
            <p className="section-sub">See what people are building on Skillfeed.</p>
          </div>
          <Link to="/ideas" className="ghost-btn">
            View all
          </Link>
        </div>

        {loading ? (
          <p className="empty-state">Loading ideas...</p>
        ) : recentIdeas.length === 0 ? (
          <div className="empty-state-block">
            <h3>No ideas yet</h3>
            <p>Be the first to post a startup idea and attract collaborators.</p>
            <Link to="/ideas" className="primary-btn">
              Post your first idea
            </Link>
          </div>
        ) : (
          <div className="feed-list">
            {recentIdeas.map((idea) => (
              <article key={idea._id || idea.id} className="feed-item">
                <div className="feed-item-top">
                  <h3>{getIdeaTitle(idea)}</h3>
                  <span className="feed-author">{getAuthorName(idea)}</span>
                </div>
                <p>{getIdeaText(idea)}</p>
                <div className="feed-meta">
                  <span>
                    {Array.isArray(idea?.likes) ? idea.likes.length : idea?.likesCount || 0} likes
                  </span>
                  <span>
                    {Array.isArray(idea?.comments) ? idea.comments.length : idea?.commentsCount || 0} comments
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
