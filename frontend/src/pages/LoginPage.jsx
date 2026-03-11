import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthCard from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Build teams, share ideas, and message your collaborators."
    >
      <form className="stack-form" onSubmit={submit}>
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && <div className="error-box">{error}</div>}

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="auth-footer">
        No account? <Link to="/register">Create one</Link>
      </div>

      {/* Developer Credit */}
      <div
        className="auth-footer"
        style={{
          textAlign: "center",
          marginTop: "10px",
          opacity: 0.7,
          fontSize: "13px"
        }}
      >
        Developed by <strong>Kshiprant</strong>
      </div>
    </AuthCard>
  );
}
