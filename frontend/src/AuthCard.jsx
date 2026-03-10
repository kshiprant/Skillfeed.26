export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand">Skillfeed</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
        {footer}
      </div>
    </div>
  );
}
