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

  return (
    <article
      className="card person-card"
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div>
        <h3>{person.name}</h3>
        <p>{person.headline || person.role || 'Member'}</p>
        <small>{(person.skills || []).join(' · ') || 'No skills added yet'}</small>
      </div>

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
    </article>
  );
}
