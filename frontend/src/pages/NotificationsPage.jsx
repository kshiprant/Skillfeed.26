import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';

export default function NotificationsPage() {
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

  return (
    <Layout
      title="Notifications"
      subtitle="Updates about connections, messages and activity."
    >
      <section className="card">
        {loading ? (
          <p className="muted">Loading notifications...</p>
        ) : error ? (
          <div className="error-box">{error}</div>
        ) : notifications.length === 0 ? (
          <p className="muted">No notifications yet.</p>
        ) : (
          notifications.map((n) => (
            <div key={n._id} className="request-row">
              <div>
                <strong>{n.title || 'Notification'}</strong>
                <p className="muted">{n.message || 'No details available.'}</p>
              </div>
            </div>
          ))
        )}
      </section>
    </Layout>
  );
}
