import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ title, subtitle, children, right }) {
  const { logout, user } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">Skillfeed</div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="top-actions">
          <span className="user-pill">{user?.name}</span>
          <button className="ghost-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="page-content">{right && <div className="page-right">{right}</div>}{children}</main>

      <nav className="bottom-nav">
        <NavLink to="/feed">Home</NavLink>
        <NavLink to="/ideas">Ideas</NavLink>
        <NavLink to="/people">People</NavLink>
        <NavLink to="/messages">Messages</NavLink>
        <NavLink to="/profile">Profile</NavLink>
      </nav>
    </div>
  );
}
