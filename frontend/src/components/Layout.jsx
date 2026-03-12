import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../api/client';

function NavIcon({ type, active }) {
  const stroke = active ? 'currentColor' : 'currentColor';

  switch (type) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V20h14V9.5" />
        </svg>
      );
    case 'ideas':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M8.5 14.5c-1.5-1.2-2.5-3-2.5-5a6 6 0 1 1 12 0c0 2-1 3.8-2.5 5" />
        </svg>
      );
    case 'people':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
          <circle cx="9.5" cy="8" r="4" />
          <path d="M20 21v-1a4 4 0 0 0-3-3.87" />
          <path d="M16 4.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'notifications':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M10 17a2 2 0 0 0 4 0" />
        </svg>
      );
    case 'messages':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a3 3 0 0 1-3 3H8l-5 3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z" />
        </svg>
      );
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    default:
      return null;
  }
}

function BottomNavItem({ to, label, icon, badge }) {
  return (
    <NavLink to={to} className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}>
      {({ isActive }) => (
        <>
          <span className="bottom-nav-icon-wrap">
            <NavIcon type={icon} active={isActive} />
            {badge > 0 ? <span className="nav-badge">{badge}</span> : null}
          </span>
          <span className="bottom-nav-label">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Layout({ title, subtitle, children, right }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadUnreadCount = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count');
        if (mounted) {
          setUnreadCount(data?.count || 0);
        }
      } catch (error) {
        console.error('Failed to load unread notifications count:', error);
      }
    };

    loadUnreadCount();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-copy">
          <div className="brand">Skillfeed</div>
          {title && <h1>{title}</h1>}
          {subtitle && <p>{subtitle}</p>}
        </div>

        <div className="top-actions">
          <NavLink to="/profile" className="user-pill">
            {user?.name || 'Profile'}
          </NavLink>
        </div>
      </header>

      <main className="page-content">
        {right && <aside className="page-right">{right}</aside>}
        {children}
      </main>

      <nav className="bottom-nav">
        <BottomNavItem to="/feed" label="Home" icon="home" />
        <BottomNavItem to="/ideas" label="Ideas" icon="ideas" />
        <BottomNavItem to="/people" label="People" icon="people" />
        <BottomNavItem to="/notifications" label="Alerts" icon="notifications" badge={unreadCount} />
        <BottomNavItem to="/messages" label="Messages" icon="messages" />
        <BottomNavItem to="/profile" label="Profile" icon="profile" />
      </nav>
    </div>
  );
}
