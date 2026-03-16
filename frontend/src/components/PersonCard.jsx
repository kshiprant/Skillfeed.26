import { useNavigate } from 'react-router-dom';

export default function PersonCard({ person, onConnect, busy = false }) {
  const navigate = useNavigate();

  const status = person.connectionStatus || 'none';

  const handleCardClick = () => {
    navigate(`/profile/${person._id}`);
  };

  const handleConnect = (e) => {
    e.stopPropagation();

    if (status === 'none') {
      onConnect(person._id);
    }
  };

  const handleAccept = (e) => {
    e.stopPropagation();
    navigate('/notifications');
  };

  const skills = Array.isArray(person.skills) ? person.skills.slice(0, 5) : [];

  const initials = (person.name || 'U')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <article
      className="card person-card upgraded"
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="person-card-left">
        <div className="person-avatar">{initials}</div>

        <div className="person-meta">
          <h3>{person.name}</h3>
          <p>{person.headline || person.role || 'Member'}</p>

          {skills.length > 0 ? (
            <div className="person-skills">
              {skills.map((skill, index) => (
                <span key={`${skill}-${index}`} className="person-skill-chip">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <small className="muted">No skills added yet</small>
          )}
        </div>
      </div>

      <div className="person-card-right">
        {status === 'accepted' ? (
          <button
            type="button"
            className="primary-btn"
            disabled
            onClick={(e) => e.stopPropagation()}
          >
            Connected
          </button>
        ) : status === 'sent' ? (
          <button
            type="button"
            className="primary-btn"
            disabled
            onClick={(e) => e.stopPropagation()}
          >
            Pending
          </button>
        ) : status === 'incoming' ? (
          <button
            type="button"
            className="ghost-btn"
            onClick={handleAccept}
          >
            Respond
          </button>
        ) : (
          <button
            type="button"
            className="primary-btn"
            disabled={busy}
            onClick={handleConnect}
          >
            {busy ? 'Sending...' : 'Connect'}
          </button>
        )}
      </div>
    </article>
  );
}
