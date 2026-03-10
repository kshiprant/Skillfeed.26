import { useState } from 'react';

export default function IdeaCard({ idea, onLike, onComment, userId }) {
  const [comment, setComment] = useState('');
  const liked = idea.likes?.some((id) => String(id) === String(userId));

  return (
    <article className="card idea-card">
      <div className="idea-header">
        <div>
          <h3>{idea.title}</h3>
          <p>{idea.user?.name} · {idea.user?.headline || 'Member'}</p>
        </div>
        <span className="chip">{idea.stage}</span>
      </div>
      <p className="body-text">{idea.description}</p>
      <div className="tag-row">
        {(idea.tags || []).map((tag) => <span key={tag} className="tag">#{tag}</span>)}
      </div>
      {!!idea.lookingFor?.length && (
        <p className="muted">Looking for: {idea.lookingFor.join(', ')}</p>
      )}
      <div className="idea-actions">
        <button className="ghost-btn" onClick={() => onLike(idea._id)}>{liked ? 'Unlike' : 'Like'} ({idea.likes?.length || 0})</button>
      </div>
      <div className="comment-list">
        {(idea.comments || []).map((item) => (
          <div key={item._id} className="comment-item">
            <strong>{item.user?.name}</strong>
            <span>{item.comment}</span>
          </div>
        ))}
      </div>
      <div className="inline-form">
        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment" />
        <button onClick={() => { if (comment.trim()) { onComment(idea._id, comment.trim()); setComment(''); } }}>Send</button>
      </div>
    </article>
  );
}
