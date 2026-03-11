import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import IdeaCard from '../components/IdeaCard';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  title: '',
  description: '',
  stage: 'Idea',
  tags: '',
  lookingFor: '',
};

export default function IdeasPage() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const loadIdeas = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/ideas');
      setIdeas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load ideas:', err);
      setIdeas([]);
      setError('Could not load ideas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIdeas();
  }, []);

  const createIdea = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      return;
    }

    try {
      setPosting(true);

      const { data: createdIdea } = await api.post('/ideas', {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        tags: form.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        lookingFor: form.lookingFor
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });

      setForm(initialForm);

      if (createdIdea) {
        setIdeas((prev) => [createdIdea, ...prev]);
      } else {
        loadIdeas();
      }
    } catch (err) {
      console.error('Failed to create idea:', err);
      setError('Could not post idea.');
    } finally {
      setPosting(false);
    }
  };

  const likeIdea = async (id) => {
    try {
      await api.post(`/ideas/${id}/like`);
      loadIdeas();
    } catch (err) {
      console.error('Failed to like idea:', err);
    }
  };

  const addComment = async (id, comment) => {
    try {
      await api.post(`/ideas/${id}/comment`, { comment });
      loadIdeas();
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  return (
    <Layout
      title="Startup ideas"
      subtitle="Post what you want to build and discover collaborators."
    >
      <form className="card idea-composer" onSubmit={createIdea}>
        <div className="idea-composer-head">
          <div className="composer-avatar">
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3>Share an idea</h3>
            <p className="muted">
              Post what you want to build and attract the right collaborators.
            </p>
          </div>
        </div>

        <input
          placeholder="Give your idea a strong title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <textarea
          placeholder="Describe the problem, your solution, and why it matters..."
          rows="5"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="composer-grid">
          <select
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value })}
          >
            <option>Idea</option>
            <option>MVP</option>
            <option>Early Traction</option>
            <option>Scaling</option>
          </select>

          <input
            placeholder="Tags, comma separated"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </div>

        <input
          placeholder="Looking for, comma separated"
          value={form.lookingFor}
          onChange={(e) => setForm({ ...form, lookingFor: e.target.value })}
        />

        {error && <div className="error-box">{error}</div>}

        <div className="composer-actions">
          <span className="muted">Tip: mention the role or skill you need.</span>
          <button className="primary-btn" type="submit" disabled={posting}>
            {posting ? 'Posting...' : 'Post Idea'}
          </button>
        </div>
      </form>

      <section className="stack-list">
        {loading ? (
          <div className="card empty-state">Loading ideas...</div>
        ) : ideas.length === 0 ? (
          <div className="card empty-state-block">
            <h3>No ideas posted yet</h3>
            <p>Share the first idea and start attracting collaborators.</p>
          </div>
        ) : (
          ideas.map((idea) => (
            <IdeaCard
              key={idea._id || idea.id}
              idea={idea}
              onLike={likeIdea}
              onComment={addComment}
              userId={user?._id}
            />
          ))
        )}
      </section>
    </Layout>
  );
}
