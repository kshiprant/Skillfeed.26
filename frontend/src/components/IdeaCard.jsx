import { useMemo, memo } from 'react';

function IdeaCard({
  idea,
  onLike,
  onOpenComments,
  onJoin,
  onDelete,
  userId,
}) {
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
  const joinRequestsCount = idea?.joinRequestsCount || 0;

  const latestComments = Array.isArray(idea?.latestComments)
    ? idea.latestComments
    : Array.isArray(idea?.comments)
    ? idea.comments.slice(-2)
    : [];

  const commentsCount =
    typeof idea?.commentsCount === 'number'
      ? idea.commentsCount
      : Array.isArray(idea?.comments)
      ? idea.comments.length
      : 0;

  const likeCount =
    typeof idea?.likesCount === 'number'
      ? idea.likesCount
      : Array.isArray(idea?.likes)
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

  const handleJoin = () => {
    if (!safeId || !onJoin) return;
    onJoin(safeId, idea);
  };

  const handleDelete = async () => {
    if (!safeId || !onDelete) return;

    const confirmed = window.confirm('Delete this idea?');
    if (!confirmed) return;

    try {
      await onDelete(safeId);
    } catch (error) {
      console.error('Failed to delete idea:', error);
    }
  };

  const handleOpenComments = () => {
    if (!safeId || !onOpenComments) return;
    onOpenComments(idea);
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
          >
            Delete
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
          onClick={handleOpenComments}
        >
          <span className="sf-action-icon">💬</span>
          <span>{commentsCount}</span>
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

      {latestComments.length > 0 ? (
        <div className="sf-comment-list">
          {latestComments.map((item, index) => (
            <div
              key={item?._id || `${item?.comment}-${index}`}
              className="sf-comment-item"
            >
              <strong>{item?.user?.name || 'User'}</strong>
              <span>{item?.comment || ''}</span>
            </div>
          ))}

          {commentsCount > latestComments.length ? (
            <button
              type="button"
              className="sf-more-comments"
              onClick={handleOpenComments}
            >
              View all {commentsCount} comments
            </button>
          ) : null}
        </div>
      ) : (
  <button
    type="button"
    className="sf-first-comment-btn"
    onClick={handleOpenComments}
  >
    <span className="sf-first-comment-icon">💬</span>
    <span>Start the conversation</span>
  </button>
)}
</article>
  );
}

export default memo(IdeaCard);
