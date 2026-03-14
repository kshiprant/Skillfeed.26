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

  const loadComments = async (targetPage = 1, append = false) => {
    if (!safeIdeaId) return;

    try {
      setError('');
      if (append) setLoadingMore(true);
      else setLoading(true);

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
    <div className="sf-drawer-overlay" onClick={onClose}>
      <div className="sf-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="sf-drawer-handle" />

        <div className="sf-drawer-header">
          <strong>{idea.title || 'Comments'}</strong>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        <div className="sf-drawer-comments">
          {loading ? (
            <div className="card empty-state">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="card empty-state-block">
              <h3>No comments yet</h3>
              <p>Start the conversation.</p>
            </div>
          ) : (
            <>
              {comments.map((item, index) => (
                <div
                  key={item?._id || `${item?.comment}-${index}`}
                  className="sf-comment-item"
                >
                  <strong>{item?.user?.name || 'User'}</strong>
                  <span>{item?.comment || ''}</span>
                </div>
              ))}

              {hasMore ? (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load more comments'}
                </button>
              ) : null}
            </>
          )}
        </div>

        <div className="sf-comment-composer">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
          />

          <button
            type="button"
            className="primary-btn sf-send-btn"
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
