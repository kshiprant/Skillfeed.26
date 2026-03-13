import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();

  const isOwnProfile = !userId || String(userId) === String(user?._id);

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(Boolean(userId));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

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
    if (isOwnProfile) {
      setProfile(user || null);
      setLoadingProfile(false);
      return;
    }

    let mounted = true;

    const loadOtherProfile = async () => {
      try {
        setLoadingProfile(true);
        setError('');

        let data = null;

        try {
          const res = await api.get(`/users/${userId}`);
          data = res.data;
        } catch {
          try {
            const res = await api.get(`/users/profile/${userId}`);
            data = res.data;
          } catch {
            const res = await api.get(`/profiles/${userId}`);
            data = res.data;
          }
        }

        if (mounted) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        if (mounted) {
          setError(err.response?.data?.message || 'Could not load this profile.');
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadOtherProfile();

    return () => {
      mounted = false;
    };
  }, [isOwnProfile, user, userId]);

  useEffect(() => {
    const source = isOwnProfile ? user : profile;
    if (!source) return;

    setForm({
      name: source.name || '',
      headline: source.headline || '',
      bio: source.bio || '',
      skills: (source.skills || []).join(', '),
      city: source.city || '',
      avatarUrl: source.avatarUrl || '',
      role: source.role || '',
      instagram: source.links?.instagram || '',
      linkedin: source.links?.linkedin || '',
      portfolio: source.links?.portfolio || '',
    });
  }, [user, profile, isOwnProfile]);

  const activeProfile = isOwnProfile ? user : profile;

  const skillsList = useMemo(() => {
    return (activeProfile?.skills || []).filter(Boolean);
  }, [activeProfile]);

  const profileLinks = useMemo(() => {
    return [
      { label: 'Instagram', value: activeProfile?.links?.instagram },
      { label: 'LinkedIn', value: activeProfile?.links?.linkedin },
      { label: 'Portfolio', value: activeProfile?.links?.portfolio },
    ].filter((item) => item.value);
  }, [activeProfile]);

  const initials = useMemo(() => {
    const name = activeProfile?.name || 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [activeProfile]);

  const save = async (e) => {
    e.preventDefault();

    if (!isOwnProfile) return;

    setSaving(true);
    setSaved('');
    setError('');

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
      setProfile(data);
      setSaved('Profile updated successfully.');
      setEditing(false);
      setTimeout(() => setSaved(''), 2500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Could not update profile.');
      setTimeout(() => setError(''), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!isOwnProfile) return;

    const confirmed = window.confirm(
      'Delete your account permanently? This will remove your profile, ideas, likes, comments, and connection requests.'
    );

    if (!confirmed) return;

    try {
      setDeletingAccount(true);
      setError('');
      await api.delete('/users/me');
      logout();
      navigate('/register');
    } catch (err) {
      console.error('Failed to delete account:', err);
      setError(err.response?.data?.message || 'Could not delete account.');
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loadingProfile) {
    return (
      <Layout
        title={isOwnProfile ? 'Your profile' : 'Profile'}
        subtitle={isOwnProfile ? 'Build a profile people would want to connect with.' : 'Viewing member profile.'}
      >
        <section className="card empty-state">
          <div className="empty-state-block">
            <h3>Loading profile...</h3>
            <p>Please wait a moment.</p>
          </div>
        </section>
      </Layout>
    );
  }

  if (!activeProfile) {
    return (
      <Layout title="Profile" subtitle="Viewing member profile.">
        <section className="card empty-state">
          <div className="empty-state-block">
            <h3>Profile unavailable</h3>
            <p>{error || 'This profile could not be loaded.'}</p>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout
      title={isOwnProfile ? 'Your profile' : activeProfile.name || 'Profile'}
      subtitle={
        isOwnProfile
          ? 'Build a profile people would want to connect with.'
          : 'Viewing member profile.'
      }
    >
      <section className="profile-page">
        <div className="card profile-card">
          <div className="profile-hero">
            <div className="profile-avatar-wrap">
              {activeProfile.avatarUrl ? (
                <img
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.name || 'Profile'}
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar profile-avatar-fallback">{initials}</div>
              )}
            </div>

            <div className="profile-main">
              <div className="profile-main-top">
                <div className="profile-identity">
                  <h2>{activeProfile.name || 'Profile'}</h2>
                  <p className="profile-headline">
                    {activeProfile.headline || activeProfile.role || 'Member'}
                  </p>

                  {(activeProfile.role || activeProfile.city) && (
                    <div className="profile-meta">
                      {activeProfile.role ? <span>{activeProfile.role}</span> : null}
                      {activeProfile.city ? <span>{activeProfile.city}</span> : null}
                    </div>
                  )}
                </div>

                {isOwnProfile ? (
                  <div className="profile-actions">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => setEditing((prev) => !prev)}
                    >
                      {editing ? 'Cancel editing' : 'Edit profile'}
                    </button>

                    <button
                      type="button"
                      className="ghost-btn danger-btn subtle-danger-btn"
                      onClick={logout}
                    >
                      Logout
                    </button>

                    <button
                      type="button"
                      className="ghost-btn danger-btn"
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount}
                    >
                      {deletingAccount ? 'Deleting account...' : 'Delete account'}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="profile-section">
                <p className="profile-bio">
                  {activeProfile.bio || 'No bio added yet.'}
                </p>
              </div>

              {skillsList.length > 0 ? (
                <div className="profile-section">
                  <div className="profile-section-label">Skills</div>
                  <div className="profile-skills">
                    {skillsList.map((skill, index) => (
                      <span className="skill-chip" key={`${skill}-${index}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {profileLinks.length > 0 ? (
                <div className="profile-section">
                  <div className="profile-section-label">Links</div>
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
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {saved ? <div className="success-box">{saved}</div> : null}
        {error ? <div className="error-box">{error}</div> : null}

        {isOwnProfile && editing ? (
          <form className="card stack-form profile-edit-form" onSubmit={save}>
            <div className="profile-form-head">
              <h3>Edit profile</h3>
              <p className="section-sub">Update how people see you on Skillfeed.</p>
            </div>

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
        ) : null}
      </section>
    </Layout>
  );
}
