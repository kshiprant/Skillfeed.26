import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../api/client';

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
        <NavLink to="/feed">Home</NavLink>
        <NavLink to="/ideas">Ideas</NavLink>
        <NavLink to="/people">People</NavLink>

        <NavLink to="/notifications" className="nav-with-badge">
          Notifications
          {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
        </NavLink>

        <NavLink to="/messages">Messages</NavLink>
        <NavLink to="/profile">Profile</NavLink>
      </nav>
    </div>
  );
}
