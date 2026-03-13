import { useMemo, useState } from 'react';

export default function IdeaCard({
  idea,
  onLike,
  onComment,
  onJoin,
  onDelete,
  userId,
}) {
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  const safeId = idea?._id || idea?.id;

  const authorName =
    idea?.user?.name || idea?.author?.name || idea?.createdBy?.name || 'Anonymous';

  const authorHeadline =
    idea?.user?.headline ||
    idea?.author?.headline ||
    idea?.createdBy?.headline ||
    'Member';

  const title = idea?.title || 'Untitled idea';
  const description = idea?.description || 'No description added yet.';
  const stage = idea?.stage || 'Idea';
  const tags = Array.isArray(idea?.tags) ? idea.tags : [];
  const comments = Array.isArray(idea?.comments) ? idea.comments : [];
  const joinRequestsCount = idea?.joinRequestsCount || 0;

  const likeCount = Array.isArray(idea?.likes)
    ? idea.likes.length
    : typeof idea?.likes === 'number'
    ? idea.likes
    : 0;

  const liked = useMemo(() => {
    if (typeof idea?.liked === 'boolean') return idea.liked;

    if (Array.isArray(idea?.likes)) {
      return idea.likes.some((like) => {
        if (typeof like === 'string') return String(like) === String(userId);
        if (like?._id) return String(like._id) === String(userId);
        return false;
      });
    }

    return false;
  }, [idea?.liked, idea?.likes, userId]);

  const isOwner =
    String(idea?.user?._id || idea?.user || '') === String(userId);

  const authorInitials = authorName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLike = () => {
    if (!safeId) return;
    onLike?.(safeId);
  };

  const handleComment = async () => {
    if (!comment.trim() || !safeId) return;

    try {
      setSending(true);
      await onComment?.(safeId, comment.trim());
      setComment('');
      setShowComposer(false);
    } catch (error) {
      console.error('Failed to send comment:', error);
    } finally {
      setSending(false);
    }
  };

  const handleJoin = () => {
    if (!safeId || !onJoin) return;
    onJoin(safeId, idea);
  };

  const handleDelete = async () => {
    if (!safeId || !onDelete) return;

    const confirmed = window.confirm('Delete this idea?');
    if (!confirmed) return;

    try {
      setDeleting(true);
      await onDelete(safeId);
    } catch (error) {
      console.error('Failed to delete idea:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="card sf-idea-card">
      <div className="sf-idea-top">
        <div className="sf-idea-author">
          <div className="sf-idea-avatar">{authorInitials}</div>

          <div className="sf-idea-author-meta">
            <div className="sf-idea-author-row">
              <strong>{authorName}</strong>
              {isOwner ? <span className="sf-owner-badge">Your idea</span> : null}
            </div>
            <span>{authorHeadline}</span>
          </div>
        </div>

        {isOwner ? (
          <button
            type="button"
            className="sf-delete-chip"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        ) : null}
      </div>

      <div className="sf-idea-body">
        <h3 className="sf-idea-title">{title}</h3>
        <p className="sf-idea-description">{description}</p>

        <div className="sf-meta-stack">
          <div className="sf-stage-row">
            <span className="sf-stage-pill">{stage}</span>
          </div>

          {tags.length > 0 ? (
            <div className="sf-tag-row">
              {tags.map((tag, index) => (
                <span key={`${tag}-${index}`} className="sf-tag">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="sf-action-row">
        <button type="button" className="sf-action-btn" onClick={handleLike}>
          <span className="sf-action-icon">{liked ? '❤️' : '🤍'}</span>
          <span>{likeCount}</span>
        </button>

        <button
          type="button"
          className="sf-action-btn"
          onClick={() => setShowComposer((prev) => !prev)}
        >
          <span className="sf-action-icon">💬</span>
          <span>{comments.length}</span>
        </button>

        <button
          type="button"
          className="sf-action-btn sf-action-btn-primary"
          onClick={handleJoin}
          disabled={!onJoin}
        >
          <span className="sf-action-icon">🚀</span>
          <span>{joinRequestsCount}</span>
        </button>
      </div>

      {comments.length > 0 ? (
        <div className="sf-comment-list">
          {comments.slice(0, 2).map((item, index) => (
            <div key={item?._id || `${item?.comment}-${index}`} className="sf-comment-item">
              <strong>{item?.user?.name || 'User'}</strong>
              <span>{item?.comment || ''}</span>
            </div>
          ))}
          {comments.length > 2 ? (
            <div className="sf-more-comments">+ {comments.length - 2} more comments</div>
          ) : null}
        </div>
      ) : null}

      {showComposer ? (
        <div className="sf-comment-composer">
          <input
            id={`comment-input-${safeId}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
          />

          <button
            className="primary-btn sf-send-btn"
            type="button"
            onClick={handleComment}
            disabled={sending || !comment.trim()}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      ) : null}
    </article>
  );
      }
