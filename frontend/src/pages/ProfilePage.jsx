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

        if (mounted) setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
        if (mounted) {
          setError(err.response?.data?.message || 'Could not load this profile.');
          setProfile(null);
        }
      } finally {
        if (mounted) setLoadingProfile(false);
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
      skills: Array.isArray(source.skills) ? source.skills.join(', ') : '',
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
    return Array.isArray(activeProfile?.skills)
      ? activeProfile.skills.filter(Boolean)
      : [];
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

  const metaItems = useMemo(() => {
    const items = [];
    if (activeProfile?.role && activeProfile.role.toLowerCase() !== 'member') {
      items.push(activeProfile.role);
    }
    if (activeProfile?.city) {
      items.push(activeProfile.city);
    }
    return items;
  }, [activeProfile]);

  const save = async (e) => {
    e.preventDefault();

    if (!isOwnProfile) return;

    setSaving(true);
    setSaved('');
    setError('');

    try {
      const trimmedName = form.name.trim();
      const trimmedHeadline = form.headline.trim();
      const trimmedBio = form.bio.trim();
      const trimmedCity = form.city.trim();
      const trimmedAvatarUrl = form.avatarUrl.trim();
      const trimmedRole = form.role.trim();
      const trimmedInstagram = form.instagram.trim();
      const trimmedLinkedin = form.linkedin.trim();
      const trimmedPortfolio = form.portfolio.trim();

      if (!trimmedName) {
        setError('Name is required.');
        setSaving(false);
        return;
      }

      if (trimmedName.length < 2) {
        setError('Name must be at least 2 characters.');
        setSaving(false);
        return;
      }

      const payload = {
        name: trimmedName,
        headline: trimmedHeadline,
        bio: trimmedBio,
        city: trimmedCity,
        role: trimmedRole,
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        links: {},
      };

      if (trimmedAvatarUrl) payload.avatarUrl = trimmedAvatarUrl;
      if (trimmedInstagram) payload.links.instagram = trimmedInstagram;
      if (trimmedLinkedin) payload.links.linkedin = trimmedLinkedin;
      if (trimmedPortfolio) payload.links.portfolio = trimmedPortfolio;

      const { data } = await api.put('/users/me', payload);

      setUser(data);
      setProfile(data);
      setSaved('Profile updated successfully.');
      setEditing(false);
      setTimeout(() => setSaved(''), 2500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      console.log('Backend error response:', err.response?.data);
      setError(err.response?.data?.message || 'Could not update profile.');
      setTimeout(() => setError(''), 3000);
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
        <section className="profile-page-v2">
          <div className="card empty-state">
            <div className="empty-state-block">
              <h3>Loading profile...</h3>
              <p>Please wait a moment.</p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (!activeProfile) {
    return (
      <Layout title="Profile" subtitle="Viewing member profile.">
        <section className="profile-page-v2">
          <div className="card empty-state">
            <div className="empty-state-block">
              <h3>Profile unavailable</h3>
              <p>{error || 'This profile could not be loaded.'}</p>
            </div>
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
      <section className="profile-page-v2">
        <section className="profile-hero-v2">
          <div className="profile-hero-top">
            <div className="profile-avatar-shell">
              {activeProfile.avatarUrl ? (
                <img
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.name || 'Profile'}
                  className="profile-avatar-v2"
                />
              ) : (
                <div className="profile-avatar-v2 profile-avatar-fallback-v2">
                  {initials}
                </div>
              )}
            </div>

            <div className="profile-identity-v2">
              <h2>{activeProfile.name || 'Profile'}</h2>
              <p className="profile-headline-v2">
                {activeProfile.headline || 'No headline added yet'}
              </p>

              {metaItems.length > 0 ? (
                <div className="profile-meta-v2">
                  {metaItems.map((item, index) => (
                    <span key={`${item}-${index}`} className="profile-meta-pill">
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {isOwnProfile ? (
            <div className="profile-primary-actions">
              <button
                type="button"
                className="primary-btn profile-edit-btn"
                onClick={() => setEditing((prev) => !prev)}
              >
                {editing ? 'Close editor' : 'Edit profile'}
              </button>
            </div>
          ) : null}
        </section>

        {saved ? <div className="success-box">{saved}</div> : null}
        {error ? <div className="error-box">{error}</div> : null}

        <section className="profile-grid-v2">
          <div className="card profile-section-card-v2">
            <div className="profile-section-head-v2">
              <h3>About</h3>
            </div>
            <p className="profile-bio-v2">
              {activeProfile.bio || 'No bio added yet.'}
            </p>
          </div>

          <div className="card profile-section-card-v2">
            <div className="profile-section-head-v2">
              <h3>Skills</h3>
            </div>

            {skillsList.length > 0 ? (
              <div className="profile-skills-v2">
                {skillsList.map((skill, index) => (
                  <span className="skill-chip-v2" key={`${skill}-${index}`}>
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="profile-empty-copy">No skills added yet.</p>
            )}
          </div>

          <div className="card profile-section-card-v2">
            <div className="profile-section-head-v2">
              <h3>Links</h3>
            </div>

            {profileLinks.length > 0 ? (
              <div className="profile-links-v2">
                {profileLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.value}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-link-pill-v2"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : (
              <p className="profile-empty-copy">No links added yet.</p>
            )}
          </div>

          {isOwnProfile && editing ? (
            <form className="card profile-editor-card-v2" onSubmit={save}>
              <div className="profile-section-head-v2">
                <h3>Edit profile</h3>
                <p>Refine your public identity on Skillfeed.</p>
              </div>

              <div className="profile-form-grid-v2">
                <div className="profile-input-group-v2">
                  <label>Name</label>
                  <input
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="profile-input-group-v2">
                  <label>Headline</label>
                  <input
                    placeholder="What do you do?"
                    value={form.headline}
                    onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  />
                </div>

                <div className="profile-input-group-v2">
                  <label>Role</label>
                  <input
                    placeholder="Founder, Designer, Developer..."
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  />
                </div>

                <div className="profile-input-group-v2">
                  <label>City</label>
                  <input
                    placeholder="Your city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>

                <div className="profile-input-group-v2 profile-input-full-v2">
                  <label>Avatar URL</label>
                  <input
                    placeholder="https://..."
                    value={form.avatarUrl}
                    onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                  />
                </div>

                <div className="profile-input-group-v2 profile-input-full-v2">
                  <label>Bio</label>
                  <textarea
                    rows="5"
                    placeholder="Tell people what you build, what you’re good at, and what kind of collaborators you want."
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                </div>

                <div className="profile-input-group-v2 profile-input-full-v2">
                  <label>Skills</label>
                  <input
                    placeholder="React, Node.js, UI Design, Digital Forensics"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  />
                </div>

                <div className="profile-input-group-v2">
                  <label>Instagram</label>
                  <input
                    placeholder="https://instagram.com/..."
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  />
                </div>

                <div className="profile-input-group-v2">
                  <label>LinkedIn</label>
                  <input
                    placeholder="https://linkedin.com/in/..."
                    value={form.linkedin}
                    onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  />
                </div>

                <div className="profile-input-group-v2 profile-input-full-v2">
                  <label>Portfolio</label>
                  <input
                    placeholder="https://yourportfolio.com"
                    value={form.portfolio}
                    onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
                  />
                </div>
              </div>

              <div className="profile-editor-actions-v2">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>

                <button className="primary-btn" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </form>
          ) : null}

          {isOwnProfile ? (
            <div className="card danger-zone-v2">
              <div className="profile-section-head-v2">
                <h3>Account</h3>
                <p>Manage your session and account access.</p>
              </div>

              <div className="danger-actions-v2">
                <button
                  type="button"
                  className="ghost-btn danger-soft-btn-v2"
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
            </div>
          ) : null}
        </section>
      </section>
    </Layout>
  );
      }
