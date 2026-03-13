import { useEffect, useState } from 'react';

export default function MessageShell({
  conversations,
  activeConversation,
  setActiveConversation,
  messages,
  currentUser,
  onSend,
  loadingConversations = false,
  loadingMessages = false,
  sendingMessage = false,
}) {
  const [messageText, setMessageText] = useState('');

  const getInitials = (name = 'U') =>
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  useEffect(() => {
    setMessageText('');
  }, [activeConversation?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ok = await onSend?.(messageText);

    if (ok) {
      setMessageText('');
    }
  };

  return (
    <div className="messages-grid">
      <section className="card convo-list convo-panel">
        <div className="panel-head">
          <div>
            <h3>Your connections</h3>
            <p className="section-sub">People you can message right now.</p>
          </div>
        </div>

        {loadingConversations ? (
          <div className="empty-state-block compact-empty">
            <h4>Loading conversations...</h4>
            <p>Please wait a moment.</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state-block compact-empty">
            <h4>No accepted connections yet</h4>
            <p>Connect with people first to unlock messaging.</p>
          </div>
        ) : (
          <div className="conversation-list">
            {conversations.map((convo) => {
              const isActive = activeConversation?._id === convo._id;
              const userName = convo.user?.name || 'Unknown user';
              const headline = convo.user?.headline || 'Skillfeed member';
              const lastMessage = convo.lastMessage || 'Start the conversation';

              return (
                <button
                  key={convo._id}
                  type="button"
                  className={`conversation-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveConversation(convo)}
                >
                  <div className="conversation-avatar">
                    {getInitials(userName)}
                  </div>

                  <div className="conversation-copy">
                    <div className="conversation-topline">
                      <strong>{userName}</strong>
                    </div>
                    <span className="conversation-headline">{headline}</span>
                    <span className="conversation-preview">{lastMessage}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="card chat-panel">
        {!activeConversation ? (
          <div className="empty-chat rich-empty-chat">
            <div className="empty-state-block compact-empty">
              <h4>Select a connection</h4>
              <p>Choose someone from the left to start chatting.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-user-block">
                <div className="conversation-avatar large">
                  {getInitials(activeConversation.user?.name || 'U')}
                </div>
                <div>
                  <h3>{activeConversation.user?.name || 'Conversation'}</h3>
                  {activeConversation.user?.headline ? (
                    <p className="muted">{activeConversation.user.headline}</p>
                  ) : (
                    <p className="muted">Skillfeed member</p>
                  )}
                </div>
              </div>
            </div>

            <div className="chat-messages">
              {loadingMessages ? (
                <div className="empty-chat">
                  <div className="empty-state-block compact-empty">
                    <h4>Loading messages...</h4>
                    <p>Fetching the conversation.</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="empty-state-block compact-empty">
                    <h4>No messages yet</h4>
                    <p>Break the silence. Send the first message.</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe =
                    String(msg.sender?._id) === String(currentUser?._id);

                  return (
                    <div
                      key={msg._id}
                      className={`bubble ${isMe ? 'me' : 'them'}`}
                    >
                      {msg.text}
                    </div>
                  );
                })
              )}
            </div>

            <form className="chat-input-row" onSubmit={handleSubmit}>
              <input
                name="message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                autoComplete="off"
                disabled={sendingMessage}
              />
              <button
                type="submit"
                className="primary-btn chat-send-btn"
                disabled={sendingMessage || !messageText.trim()}
              >
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
