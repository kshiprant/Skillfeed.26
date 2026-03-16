import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { socket } from '../socket';

export default function NotificationsPage() {
  const { token } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Notification load failed', err);
      setError(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!token) return;

    socket.auth = { token };

    if (!socket.connected) {
      socket.connect();
    }

    const handleNewNotification = (notification) => {
      setNotifications((prev) => {
        const exists = prev.some(
          (item) => String(item._id) === String(notification._id)
        );
        if (exists) return prev;
        return [notification, ...prev];
      });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [token]);

  return (
    <div className="page-stack">
      <section className="hero-card hero-card--notifications">
        <div className="hero-copy">
          <span className="hero-eyebrow">Alerts</span>
          <h2>Notifications and activity updates</h2>
          <p>
            Track connection requests, messages, and platform activity in one
            place.
          </p>
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <h3>Recent notifications</h3>
            <p className="section-sub">
              Updates about connections, messages, and activity.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="muted">Loading notifications...</p>
        ) : error ? (
          <div className="error-box">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state-block">
            <h3>No notifications yet</h3>
            <p>When something happens on Skillfeed, it will show up here.</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((n) => (
              <article key={n._id} className="notification-card">
                <div className="notification-dot" />
                <div className="notification-copy">
                  <strong>{n.title || 'Notification'}</strong>
                  <p className="muted">
                    {n.message || 'No details available.'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
