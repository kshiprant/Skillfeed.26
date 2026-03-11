import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [form, setForm] = useState({
    name: '',
    headline: '',
    bio: '',
    skills: '',
    city: '',
    avatarUrl: '',
    role: '',
    instagram: '',
    linkedin: '',
    portfolio: '',
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      headline: user.headline || '',
      bio: user.bio || '',
      skills: (user.skills || []).join(', '),
      city: user.city || '',
      avatarUrl: user.avatarUrl || '',
      role: user.role || '',
      instagram: user.links?.instagram || '',
      linkedin: user.links?.linkedin || '',
      portfolio: user.links?.portfolio || '',
    });
  }, [user]);

  const skillsList = useMemo(() => {
    return (user?.skills || []).filter(Boolean);
  }, [user]);

  const profileLinks = useMemo(() => {
    return [
      { label: 'Instagram', value: user?.links?.instagram },
      { label: 'LinkedIn', value: user?.links?.linkedin },
      { label: 'Portfolio', value: user?.links?.portfolio },
    ].filter((item) => item.value);
  }, [user]);

  const initials = useMemo(() => {
    const name = user?.name || 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved('');

    try {
      const payload = {
        name: form.name,
        headline: form.headline,
        bio: form.bio,
        city: form.city,
        avatarUrl: form.avatarUrl,
        role: form.role,
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        links: {
          instagram: form.instagram,
          linkedin: form.linkedin,
          portfolio: form.portfolio,
        },
      };

      const { data } = await api.put('/users/me', payload);
      setUser(data);
      setSaved('Profile updated successfully.');
      setEditing(false);
      setTimeout(() => setSaved(''), 2500);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSaved('Could not update profile.');
      setTimeout(() => setSaved(''), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Your profile" subtitle="Build a profile people would want to connect with.">
      <section className="profile-page">
        <div className="card profile-card">
          <div className="profile-hero">
            <div className="profile-avatar-wrap">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.name || 'Profile'}
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar profile-avatar-fallback">{initials}</div>
              )}
            </div>

            <div className="profile-main">
              <div className="profile-head-row">
                <div>
                  <h2>{user?.name || 'Your name'}</h2>
                  <p className="profile-headline">
                    {user?.headline || user?.role || 'Add a headline to tell people what you do.'}
                  </p>
                </div>

                <div className="profile-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setEditing((prev) => !prev)}
                  >
                    {editing ? 'Cancel' : 'Edit profile'}
                  </button>
                  <button type="button" className="ghost-btn danger-btn" onClick={logout}>
                    Logout
                  </button>
                </div>
              </div>

              <div className="profile-meta">
                {user?.role && <span>{user.role}</span>}
                {user?.city && <span>{user.city}</span>}
              </div>

              <p className="profile-bio">
                {user?.bio || 'Your bio will appear here. Add your story, interests, and what you are building.'}
              </p>

              {skillsList.length > 0 && (
                <div className="profile-skills">
                  {skillsList.map((skill, index) => (
                    <span className="skill-chip" key={`${skill}-${index}`}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {profileLinks.length > 0 && (
                <div className="profile-links">
                  {profileLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.value}
                      target="_blank"
                      rel="noreferrer"
                      className="profile-link"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {saved && <div className="success-box">{saved}</div>}

        {editing && (
          <form className="card stack-form profile-edit-form" onSubmit={save}>
            <h3>Edit profile</h3>

            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              placeholder="Headline"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
            <input
              placeholder="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <input
              placeholder="Avatar URL"
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
            />
            <textarea
              rows="4"
              placeholder="Bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
            <input
              placeholder="Skills, comma separated"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
            <input
              placeholder="Instagram link"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            />
            <input
              placeholder="LinkedIn link"
              value={form.linkedin}
              onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
            />
            <input
              placeholder="Portfolio link"
              value={form.portfolio}
              onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
            />

            <button className="primary-btn" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        )}
      </section>
    </Layout>
  );
                           }
