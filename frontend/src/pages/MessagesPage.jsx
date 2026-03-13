import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import MessageShell from '../components/MessageShell';
import { socket } from '../socket';

export default function MessagesPage() {
  const { user, token } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');

  const joinedConversationRef = useRef(null);

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
    if (!token) return;

    socket.auth = { token };

    if (!socket.connected) {
      socket.connect();
    }

    const handleMessageNew = ({ conversationId, message }) => {
      if (String(activeConversation?._id) === String(conversationId)) {
        setMessages((prev) => {
          const alreadyExists = prev.some(
            (item) => String(item._id) === String(message._id)
          );
          if (alreadyExists) return prev;
          return [...prev, message];
        });
      }

      loadConversations(activeConversation?._id || null);
    };

    const handleConversationUpdated = () => {
      loadConversations(activeConversation?._id || null);
    };

    socket.on('message:new', handleMessageNew);
    socket.on('conversation:updated', handleConversationUpdated);

    return () => {
      socket.off('message:new', handleMessageNew);
      socket.off('conversation:updated', handleConversationUpdated);
    };
  }, [token, activeConversation?._id]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversation?.user?._id) {
        setMessages([]);

        if (joinedConversationRef.current) {
          socket.emit('leave_conversation', {
            conversationId: joinedConversationRef.current,
          });
          joinedConversationRef.current = null;
        }

        return;
      }

      try {
        setLoadingMessages(true);
        setError('');

        const { data } = await api.get(
          `/messages/thread/${activeConversation.user._id}`
        );

        const nextMessages = Array.isArray(data?.messages) ? data.messages : [];
        setMessages(nextMessages);

        const nextConversationId = data?.conversationId;

        if (
          joinedConversationRef.current &&
          joinedConversationRef.current !== nextConversationId
        ) {
          socket.emit('leave_conversation', {
            conversationId: joinedConversationRef.current,
          });
        }

        if (nextConversationId && socket.connected) {
          socket.emit('join_conversation', {
            conversationId: nextConversationId,
          });
          joinedConversationRef.current = nextConversationId;
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError(err.response?.data?.message || 'Failed to load messages.');
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeConversation?.user?._id]);

  useEffect(() => {
    return () => {
      if (joinedConversationRef.current) {
        socket.emit('leave_conversation', {
          conversationId: joinedConversationRef.current,
        });
      }
    };
  }, []);

  const onSend = async (text) => {
    const safeText = typeof text === 'string' ? text.trim() : '';

    if (!safeText || !activeConversation?.user?._id || sendingMessage) {
      return false;
    }

    setError('');
    setSendingMessage(true);

    try {
      const { data } = await api.post('/messages', {
        text: safeText,
        toUser: activeConversation.user._id,
      });

      const newMessage = data?.message || data;

      if (newMessage && typeof newMessage === 'object') {
        setMessages((prev) => {
          const alreadyExists = prev.some(
            (item) => String(item._id) === String(newMessage._id)
          );
          if (alreadyExists) return prev;
          return [...prev, newMessage];
        });
      }

      try {
        await loadConversations(activeConversation?._id || null);
      } catch (err) {
        console.error('Failed to refresh conversations after sending:', err);
      }

      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.response?.data?.message || 'Failed to send message.');
      return false;
    } finally {
      setSendingMessage(false);
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
        sendingMessage={sendingMessage}
      />
    </Layout>
  );
}
