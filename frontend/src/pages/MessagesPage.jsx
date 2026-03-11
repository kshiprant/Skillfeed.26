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
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');

  const loadConversations = async (preserveActiveId = null) => {
    try {
      setLoadingConversations(true);
      setError('');

      const { data } = await api.get('/messages');
      const convoList = Array.isArray(data) ? data : [];

      setConversations(convoList);

      if (!convoList.length) {
        setActiveConversation(null);
        setMessages([]);
        return;
      }

      if (preserveActiveId) {
        const matched = convoList.find((item) => item._id === preserveActiveId);
        if (matched) {
          setActiveConversation(matched);
          return;
        }
      }

      setActiveConversation((prev) => {
        if (prev?._id) {
          const matched = convoList.find((item) => item._id === prev._id);
          return matched || convoList[0];
        }
        return convoList[0];
      });
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err.response?.data?.message || 'Failed to load conversations.');
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversation?.user?._id) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        setError('');

        const { data } = await api.get(`/messages/thread/${activeConversation.user._id}`);
        setMessages(Array.isArray(data?.messages) ? data.messages : []);
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError(err.response?.data?.message || 'Failed to load messages.');
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeConversation?._id]);

  const onSend = async (e) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const text = form.get('message')?.toString().trim();

    if (!text || !activeConversation?.user?._id) return;

    try {
      setError('');

      await api.post('/messages', {
        text,
        toUser: activeConversation.user._id,
      });

      e.currentTarget.reset();

      const { data } = await api.get(`/messages/thread/${activeConversation.user._id}`);
      setMessages(Array.isArray(data?.messages) ? data.messages : []);

      await loadConversations(activeConversation._id);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.response?.data?.message || 'Failed to send message.');
    }
  };

  return (
    <Layout title="Messages" subtitle="Only accepted connections can chat.">
      {error ? <div className="error-box">{error}</div> : null}

      <MessageShell
        conversations={conversations}
        activeConversation={activeConversation}
        setActiveConversation={setActiveConversation}
        messages={messages}
        currentUser={user}
        onSend={onSend}
        loadingConversations={loadingConversations}
        loadingMessages={loadingMessages}
      />
    </Layout>
  );
}
