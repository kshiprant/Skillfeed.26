import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: '', headline: '', bio: '', skills: '', city: '', avatarUrl: '', role: '', instagram: '', linkedin: '', portfolio: '',
  });
  const [saved, setSaved] = useState('');

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

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      headline: form.headline,
      bio: form.bio,
      city: form.city,
      avatarUrl: form.avatarUrl,
      role: form.role,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      links: {
        instagram: form.instagram,
        linkedin: form.linkedin,
        portfolio: form.portfolio,
      },
    };
    const { data } = await api.put('/users/me', payload);
    setUser(data);
    setSaved('Profile updated.');
    setTimeout(() => setSaved(''), 2000);
  };

  return (
    <Layout title="Your profile" subtitle="This page replaces the broken create-profile flow.">
      <form className="card stack-form" onSubmit={save}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Headline" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
        <input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input placeholder="Avatar URL" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
        <textarea rows="4" placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <input placeholder="Skills, comma separated" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
        <input placeholder="Instagram link" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
        <input placeholder="LinkedIn link" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
        <input placeholder="Portfolio link" value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} />
        {saved && <div className="success-box">{saved}</div>}
        <button className="primary-btn" type="submit">Save profile</button>
      </form>
    </Layout>
  );
}
