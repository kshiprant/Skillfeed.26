export default function StatCard({ label, value, hint }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
      </div>

      <strong className="stat-value">{value}</strong>

      {hint ? <small className="stat-hint">{hint}</small> : null}
    </article>
  );
}
