import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import IdeaCard from '../components/IdeaCard';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const initialForm = { title: '', description: '', stage: 'Idea', tags: '', lookingFor: '' };

export default function IdeasPage() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [form, setForm] = useState(initialForm);

  const loadIdeas = async () => {
    const { data } = await api.get('/ideas');
    setIdeas(data);
  };

  useEffect(() => { loadIdeas(); }, []);

  const createIdea = async (e) => {
    e.preventDefault();
    await api.post('/ideas', {
      ...form,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      lookingFor: form.lookingFor.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setForm(initialForm);
    loadIdeas();
  };

  const likeIdea = async (id) => { await api.post(`/ideas/${id}/like`); loadIdeas(); };
  const addComment = async (id, comment) => { await api.post(`/ideas/${id}/comment`, { comment }); loadIdeas(); };

  return (
    <Layout title="Startup ideas" subtitle="Post what you want to build and attract collaborators.">
      <form className="card stack-form" onSubmit={createIdea}>
        <h3>Post new idea</h3>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea placeholder="Describe your idea" rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
          <option>Idea</option><option>MVP</option><option>Early Traction</option><option>Scaling</option>
        </select>
        <input placeholder="Tags, comma separated" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <input placeholder="Looking for, comma separated" value={form.lookingFor} onChange={(e) => setForm({ ...form, lookingFor: e.target.value })} />
        <button className="primary-btn" type="submit">Post Idea</button>
      </form>
      <section className="stack-list">
        {ideas.map((idea) => <IdeaCard key={idea._id} idea={idea} onLike={likeIdea} onComment={addComment} userId={user._id} />)}
      </section>
    </Layout>
  );
}
