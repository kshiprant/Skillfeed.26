import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import IdeaCard from '../components/IdeaCard';
import CommentDrawer from '../components/CommentDrawer';
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

const stageOptions = ['Idea', 'MVP', 'Early Traction', 'Scaling'];

const toPreviewList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);

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

  const [selectedIdea, setSelectedIdea] = useState(null);

  const previewTags = useMemo(() => toPreviewList(form.tags), [form.tags]);
  const previewLookingFor = useMemo(
    () => toPreviewList(form.lookingFor),
    [form.lookingFor]
  );

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
                likesCount: data.likes,
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
      } else if (data?.commentsCount !== undefined || data?.latestComments) {
        setIdeas((prev) =>
          prev.map((idea) =>
            String(idea._id || idea.id) === String(id)
              ? {
                  ...idea,
                  commentsCount: data?.commentsCount ?? idea.commentsCount,
                  latestComments: data?.latestComments ?? idea.latestComments,
                }
              : idea
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

  const openCommentsDrawer = (idea) => {
    setSelectedIdea(idea);
  };

  const closeCommentsDrawer = () => {
    setSelectedIdea(null);
  };

  const handleDrawerCommentAdded = (ideaId, data) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        String(idea._id || idea.id) === String(ideaId)
          ? {
              ...idea,
              commentsCount: data?.commentsCount ?? idea.commentsCount,
              latestComments: data?.latestComments ?? idea.latestComments,
            }
          : idea
      )
    );

    setSelectedIdea((prev) =>
      prev && String(prev._id || prev.id) === String(ideaId)
        ? {
            ...prev,
            commentsCount: data?.commentsCount ?? prev.commentsCount,
            latestComments: data?.latestComments ?? prev.latestComments,
          }
        : prev
    );
  };

  return (
    <Layout
      title="Startup ideas"
      subtitle="Post what you want to build and discover collaborators."
    >
      <form
        className="card idea-composer idea-composer-upgraded"
        onSubmit={createIdea}
      >
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

        <div className="composer-section">
          <label className="composer-label">Idea title</label>
          <input
            placeholder="Give your idea a strong title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="composer-section">
          <label className="composer-label">Description</label>
          <textarea
            className="composer-textarea"
            placeholder="Describe the problem, your solution, who it is for, and why it matters..."
            rows="6"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <span className="composer-helper">
            Explain the idea clearly so the right people want to join.
          </span>
        </div>

        <div className="composer-section">
          <label className="composer-label">Stage</label>
          <div className="stage-chip-row">
            {stageOptions.map((stage) => (
              <button
                key={stage}
                type="button"
                className={`stage-chip ${form.stage === stage ? 'active' : ''}`}
                onClick={() => setForm({ ...form, stage })}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        <div className="composer-grid upgraded">
          <div className="composer-section">
            <label className="composer-label">Tags</label>
            <input
              placeholder="React, AI, Fintech"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
            {previewTags.length > 0 ? (
              <div className="composer-preview-row">
                {previewTags.map((tag, index) => (
                  <span key={`${tag}-${index}`} className="composer-preview-chip">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="composer-section">
            <label className="composer-label">Looking for</label>
            <input
              placeholder="Designer, Frontend, Marketer"
              value={form.lookingFor}
              onChange={(e) => setForm({ ...form, lookingFor: e.target.value })}
            />
            {previewLookingFor.length > 0 ? (
              <div className="composer-preview-row">
                {previewLookingFor.map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className="composer-preview-chip subtle"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="composer-actions upgraded">
          <span className="muted">
            Tip: be specific about the role, skill, or contribution you need.
          </span>
          <button
            className="primary-btn composer-submit-btn"
            type="submit"
            disabled={posting}
          >
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
              onOpenComments={openCommentsDrawer}
              onJoin={openJoinRequest}
              onDelete={deleteIdea}
              userId={user?._id}
            />
          ))
        )}
      </section>

      <CommentDrawer
        open={Boolean(selectedIdea)}
        idea={selectedIdea}
        onClose={closeCommentsDrawer}
        onCommentAdded={handleDrawerCommentAdded}
      />
    </Layout>
  );
}
