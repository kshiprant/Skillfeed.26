export default function MessageShell({ conversations, activeConversation, setActiveConversation, messages, currentUser, onSend }) {
  return (
    <div className="messages-grid">
      <section className="card convo-list">
        <h3>Your connections</h3>
        {conversations.length === 0 ? <p className="muted">No accepted connections yet. Connect with people first.</p> : conversations.map((convo) => {
          const other = convo.members.find((m) => m._id !== currentUser._id);
          return (
            <button key={convo._id} className={`conversation-item ${activeConversation?._id === convo._id ? 'active' : ''}`} onClick={() => setActiveConversation(convo)}>
              <strong>{other?.name}</strong>
              <span>{convo.lastMessage || 'Start the conversation'}</span>
            </button>
          );
        })}
      </section>

      <section className="card chat-panel">
        {!activeConversation ? (
          <div className="empty-chat">Select a connection to start chatting.</div>
        ) : (
          <>
            <div className="chat-header">
              <h3>{activeConversation.members.find((m) => m._id !== currentUser._id)?.name}</h3>
            </div>
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg._id} className={`bubble ${msg.sender._id === currentUser._id ? 'me' : 'them'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <form className="chat-input-row" onSubmit={onSend}>
              <input name="message" placeholder="Type a message..." autoComplete="off" />
              <button type="submit">Send</button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
