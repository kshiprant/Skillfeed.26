export default function PersonCard({ person, onConnect }) {
  return (
    <article className="card person-card">
      <div>
        <h3>{person.name}</h3>
        <p>{person.headline || person.role || 'Member'}</p>
        <small>{(person.skills || []).join(' · ') || 'No skills added yet'}</small>
      </div>
      <button className="primary-btn" disabled={person.relationStatus !== 'none'} onClick={() => onConnect(person._id)}>
        {person.relationStatus === 'pending' ? 'Pending' : person.relationStatus === 'accepted' ? 'Connected' : 'Connect'}
      </button>
    </article>
  );
}
