import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import MessageShell from '../components/MessageShell';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const loadConversations = async () => {
    const { data } = await api.get('/messages/conversations');
    setConversations(data);
    if (!activeConversation && data.length) setActiveConversation(data[0]);
  };

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversation) return setMessages([]);
      const { data } = await api.get(`/messages/${activeConversation._id}`);
      setMessages(data);
    };
    loadMessages();
  }, [activeConversation]);

  const onSend = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = form.get('message')?.toString().trim();
    if (!text || !activeConversation) return;
    const other = activeConversation.members.find((m) => m._id !== user._id);
    await api.post('/messages', { receiverId: other._id, text });
    e.currentTarget.reset();
    const { data } = await api.get(`/messages/${activeConversation._id}`);
    setMessages(data);
    loadConversations();
  };

  return (
    <Layout title="Messages" subtitle="Only accepted connections can chat.">
      <MessageShell
        conversations={conversations}
        activeConversation={activeConversation}
        setActiveConversation={setActiveConversation}
        messages={messages}
        currentUser={user}
        onSend={onSend}
      />
    </Layout>
  );
}
