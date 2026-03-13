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

  const safeId = idea?._id || idea?.id;

  const authorName =
    idea?.user?.name || idea?.author?.name || idea?.createdBy?.name || 'Anonymous';

  const authorHeadline =
    idea?.user?.headline ||
    idea?.author?.headline ||
    idea?.createdBy?.headline ||
    'Member';

  const authorInitial = authorName.charAt(0).toUpperCase();
  const title = idea?.title || 'Untitled idea';
  const description = idea?.description || 'No description added yet.';
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
    <article className="card idea-card">
      <div className="idea-author">
        <div className="avatar">{authorInitial}</div>

        <div className="author-meta">
          <strong>{authorName}</strong>
          <span>{authorHeadline}</span>
        </div>
      </div>

      <h3 className="idea-title">{title}</h3>

      <p className="idea-description">{description}</p>

      {tags.length > 0 && (
        <div className="tag-row">
          {tags.map((tag, index) => (
            <span key={`${tag}-${index}`} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="idea-stage">{idea?.stage || 'Idea'}</div>

      <div className="idea-stats">
        <span>❤️ {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
        <span>💬 {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</span>
        <span>🚀 {joinRequestsCount} Join Requests</span>
      </div>

      <div className="idea-actions">
        <button className="ghost-btn" type="button" onClick={handleLike}>
          {liked ? 'Unlike' : 'Like'}
        </button>

        <button
          className="ghost-btn"
          type="button"
          onClick={() => {
            const input = document.getElementById(`comment-input-${safeId}`);
            input?.focus();
          }}
        >
          Comment
        </button>

        <button
          className="primary-btn"
          type="button"
          onClick={handleJoin}
          disabled={!onJoin}
        >
          Join Project
        </button>

        {isOwner && (
          <button
            className="ghost-btn danger-btn"
            type="button"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Idea'}
          </button>
        )}
      </div>

      {comments.length > 0 && (
        <div className="comment-list">
          {comments.map((item, index) => (
            <div key={item?._id || `${item?.comment}-${index}`} className="comment-item">
              <strong>{item?.user?.name || 'User'}</strong>
              <span>{item?.comment || ''}</span>
            </div>
          ))}
        </div>
      )}

      <div className="inline-form">
        <input
          id={`comment-input-${safeId}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment..."
        />

        <button
          className="primary-btn"
          type="button"
          onClick={handleComment}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </article>
  );
}
