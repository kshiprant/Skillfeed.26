import { useCallback, useEffect, useState } from 'react';
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

const initialJoinForm = {
  roleRequested: '',
  message: '',
};

export default function IdeasPage() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const [joinIdea, setJoinIdea] = useState(null);
  const [joinForm, setJoinForm] = useState(initialJoinForm);
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');

  const loadIdeas = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/ideas?limit=10');
      setIdeas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load ideas:', err);
      setIdeas([]);
      setError('Could not load ideas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

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
      const { data } = await api.post(`/ideas/${id}/like`);

      setIdeas((prev) =>
        prev.map((idea) =>
          String(idea._id || idea.id) === String(id)
            ? {
                ...idea,
                likes: data.likes,
                liked: data.liked,
                score: data.score,
              }
            : idea
        )
      );
    } catch (err) {
      console.error('Failed to like idea:', err);
    }
  };

  const addComment = async (id, comment) => {
    try {
      const { data } = await api.post(`/ideas/${id}/comment`, { text: comment });

      if (data?.idea) {
        setIdeas((prev) =>
          prev.map((idea) =>
            String(idea._id || idea.id) === String(id) ? data.idea : idea
          )
        );
      } else {
        loadIdeas();
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const deleteIdea = async (id) => {
    try {
      await api.delete(`/ideas/${id}`);
      setIdeas((prev) =>
        prev.filter((idea) => String(idea._id || idea.id) !== String(id))
      );
    } catch (err) {
      console.error('Failed to delete idea:', err);
      setError(err.response?.data?.message || 'Could not delete idea.');
    }
  };

  const openJoinRequest = (ideaId, idea) => {
    if (idea?.user?._id && String(idea.user._id) === String(user?._id)) {
      setJoinMessage('You cannot join your own project.');
      setTimeout(() => setJoinMessage(''), 2500);
      return;
    }

    setJoinIdea({ id: ideaId, title: idea?.title || 'this project' });
    setJoinForm(initialJoinForm);
    setJoinMessage('');
  };

  const submitJoinRequest = async (e) => {
    e.preventDefault();

    if (!joinIdea?.id) return;

    try {
      setJoining(true);
      setJoinMessage('');

      await api.post(`/join-requests/${joinIdea.id}`, {
        roleRequested: joinForm.roleRequested.trim(),
        message: joinForm.message.trim(),
      });

      setJoinMessage('Join request sent successfully.');
      setJoinIdea(null);
      setJoinForm(initialJoinForm);
    } catch (err) {
      console.error('Failed to send join request:', err);
      setJoinMessage(
        err.response?.data?.message || 'Could not send join request.'
      );
    } finally {
      setJoining(false);
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

      {joinIdea && (
        <form className="card stack-form" onSubmit={submitJoinRequest}>
          <h3>Join project</h3>
          <p className="muted">
            Send a request to join <strong>{joinIdea.title}</strong>.
          </p>

          <input
            placeholder="Role you can contribute in"
            value={joinForm.roleRequested}
            onChange={(e) =>
              setJoinForm({ ...joinForm, roleRequested: e.target.value })
            }
          />

          <textarea
            rows="4"
            placeholder="Why should the founder choose you?"
            value={joinForm.message}
            onChange={(e) =>
              setJoinForm({ ...joinForm, message: e.target.value })
            }
          />

          {joinMessage && <div className="success-box">{joinMessage}</div>}

          <div className="composer-actions">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setJoinIdea(null);
                setJoinForm(initialJoinForm);
                setJoinMessage('');
              }}
            >
              Cancel
            </button>

            <button className="primary-btn" type="submit" disabled={joining}>
              {joining ? 'Sending...' : 'Send Join Request'}
            </button>
          </div>
        </form>
      )}

      {!joinIdea && joinMessage && (
        <div className="success-box">{joinMessage}</div>
      )}

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
              onJoin={openJoinRequest}
              onDelete={deleteIdea}
              userId={user?._id}
            />
          ))
        )}
      </section>
    </Layout>
  );
}
