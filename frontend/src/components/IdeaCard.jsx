import { useState } from 'react';

export default function IdeaCard({ idea, onLike, onComment, userId }) {
  const [comment, setComment] = useState('');

  const liked = idea.likes?.some((id) => String(id) === String(userId));

  return (
    <article className="card idea-card">

      {/* Author */}
      <div className="idea-author">
        <div className="avatar">
          {idea.user?.name?.charAt(0)?.toUpperCase()}
        </div>

        <div className="author-meta">
          <strong>{idea.user?.name}</strong>
          <span>{idea.user?.headline || 'Member'}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="idea-title">{idea.title}</h3>

      {/* Description */}
      <p className="idea-description">{idea.description}</p>

      {/* Tags */}
      <div className="tag-row">
        {(idea.tags || []).map((tag) => (
          <span key={tag} className="tag">#{tag}</span>
        ))}
      </div>

      {/* Stage */}
      <div className="idea-stage">{idea.stage}</div>

      {/* Actions */}
      <div className="idea-actions">
        <button
          className="ghost-btn"
          onClick={() => onLike(idea._id)}
        >
          {liked ? 'Unlike' : 'Like'} ({idea.likes?.length || 0})
        </button>

        <span className="muted">
          {idea.comments?.length || 0} comments
        </span>
      </div>

      {/* Comments */}
      <div className="comment-list">
        {(idea.comments || []).map((item) => (
          <div key={item._id} className="comment-item">
            <strong>{item.user?.name}</strong>
            <span>{item.comment}</span>
          </div>
        ))}
      </div>

      {/* Comment input */}
      <div className="inline-form">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment..."
        />

        <button
          className="primary-btn"
          onClick={() => {
            if (comment.trim()) {
              onComment(idea._id, comment.trim());
              setComment('');
            }
          }}
        >
          Send
        </button>
      </div>

    </article>
  );
}
