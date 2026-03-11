export default function MessageShell({
  conversations,
  activeConversation,
  setActiveConversation,
  messages,
  currentUser,
  onSend,
  loadingConversations = false,
  loadingMessages = false,
}) {
  return (
    <div className="messages-grid">
      <section className="card convo-list">
        <h3>Your connections</h3>

        {loadingConversations ? (
          <p className="muted">Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <p className="muted">No accepted connections yet. Connect with people first.</p>
        ) : (
          conversations.map((convo) => (
            <button
              key={convo._id}
              type="button"
              className={`conversation-item ${
                activeConversation?._id === convo._id ? 'active' : ''
              }`}
              onClick={() => setActiveConversation(convo)}
            >
              <strong>{convo.user?.name || 'Unknown user'}</strong>
              <span>{convo.lastMessage || 'Start the conversation'}</span>
            </button>
          ))
        )}
      </section>

      <section className="card chat-panel">
        {!activeConversation ? (
          <div className="empty-chat">Select a connection to start chatting.</div>
        ) : (
          <>
            <div className="chat-header">
              <h3>{activeConversation.user?.name || 'Conversation'}</h3>
              {activeConversation.user?.headline ? (
                <p className="muted">{activeConversation.user.headline}</p>
              ) : null}
            </div>

            <div className="chat-messages">
              {loadingMessages ? (
                <div className="empty-chat">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="empty-chat">No messages yet. Start the conversation.</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`bubble ${
                      String(msg.sender?._id) === String(currentUser?._id) ? 'me' : 'them'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))
              )}
            </div>

            <form className="chat-input-row" onSubmit={onSend}>
              <input
                name="message"
                placeholder="Type a message..."
                autoComplete="off"
              />
              <button type="submit" className="primary-btn">
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
