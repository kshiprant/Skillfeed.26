import { useEffect, useState } from 'react';
import api from '../api/client';

export default function CommentDrawer({
  open,
  idea,
  onClose,
  onCommentAdded,
}) {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const safeIdeaId = idea?._id || idea?.id;
  const commentsCount =
    typeof idea?.commentsCount === 'number'
      ? idea.commentsCount
      : Array.isArray(idea?.comments)
      ? idea.comments.length
      : 0;

  const loadComments = async (targetPage = 1, append = false) => {
    if (!safeIdeaId) return;

    try {
      setError('');

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const { data } = await api.get(
        `/ideas/${safeIdeaId}/comments?page=${targetPage}&limit=10`
      );

      const incoming = Array.isArray(data?.comments) ? data.comments : [];

      setComments((prev) => (append ? [...prev, ...incoming] : incoming));
      setPage(data?.page || targetPage);
      setHasMore(Boolean(data?.hasMore));
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('Could not load comments.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!open || !safeIdeaId) return;
    loadComments(1, false);
  }, [open, safeIdeaId]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    loadComments(page + 1, true);
  };

  const handleSend = async () => {
    if (!comment.trim() || !safeIdeaId) return;

    try {
      setSending(true);
      setError('');

      const { data } = await api.post(`/ideas/${safeIdeaId}/comment`, {
        text: comment.trim(),
      });

      setComment('');

      if (data?.comment) {
        setComments((prev) => [data.comment, ...prev]);
      }

      onCommentAdded?.(safeIdeaId, data);
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError(err.response?.data?.message || 'Could not send comment.');
    } finally {
      setSending(false);
    }
  };

  if (!open || !idea) return null;

  return (
    <div className="comment-drawer-overlay" onClick={onClose}>
      <div
        className="comment-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="comment-drawer-handle" />

        <div className="comment-drawer-head">
          <div className="comment-drawer-title-wrap">
            <h3 className="comment-drawer-title">{idea.title || 'Comments'}</h3>
            <p className="comment-drawer-subtitle">
              {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
            </p>
          </div>

          <button
            type="button"
            className="comment-drawer-close"
            onClick={onClose}
            aria-label="Close comments"
          >
            ✕
          </button>
        </div>

        <div className="comment-drawer-idea-meta">
          <p>{idea.description || 'No description available.'}</p>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        <div className="comment-drawer-body">
          {loading ? (
            <div className="card empty-state">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="card empty-state-block">
              <h3>No comments yet</h3>
              <p>Start the conversation.</p>
            </div>
          ) : (
            <>
              <div className="comment-drawer-list">
                {comments.map((item, index) => {
                  const name = item?.user?.name || 'User';
                  const avatar =
                    name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'U';

                  return (
                    <div
                      key={item?._id || `${item?.comment}-${index}`}
                      className="comment-drawer-item"
                    >
                      <div className="comment-drawer-avatar">{avatar}</div>

                      <div className="comment-drawer-content">
                        <strong>{name}</strong>
                        <span>{item?.comment || ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore ? (
                <button
                  type="button"
                  className="ghost-btn comment-drawer-load-more"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load more comments'}
                </button>
              ) : null}
            </>
          )}
        </div>

        <div className="comment-drawer-composer">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
          />

          <button
            type="button"
            className="primary-btn"
            onClick={handleSend}
            disabled={sending || !comment.trim()}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
              }
