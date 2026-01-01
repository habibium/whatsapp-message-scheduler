import { Link } from "react-router-dom";
import { useMessages } from "../hooks/useMessages";
import "./MessagesPage.css";

export function MessagesPage() {
  const { messages, loading, toggleEnabled, remove } = useMessages();

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    await toggleEnabled(id, !currentEnabled);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this scheduled message?")) {
      await remove(id);
    }
  };

  return (
    <div className="messages-page animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1 className="page-title">Scheduled Messages</h1>
          <p className="page-subtitle">Manage your automated WhatsApp messages</p>
        </div>
        <Link to="/messages/new" className="btn btn-primary">
          + New Message
        </Link>
      </header>

      {loading ? (
        <div className="messages-loading">
          <div className="spinner spinner-lg" />
        </div>
      ) : messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3 className="empty-title">No Scheduled Messages</h3>
          <p className="empty-description">
            Create your first scheduled message to start automating your WhatsApp communications.
          </p>
          <Link to="/messages/new" className="btn btn-primary">
            Create Message
          </Link>
        </div>
      ) : (
        <div className="messages-table-container">
          <table className="messages-table">
            <thead>
              <tr>
                <th>Target</th>
                <th>Message</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg.id}>
                  <td>
                    <div className="target-cell">
                      <span className="target-icon">{msg.isGroup ? "👥" : "👤"}</span>
                      <span className="target-name">{msg.target}</span>
                    </div>
                  </td>
                  <td>
                    <div className="message-preview">
                      {msg.message.substring(0, 60)}
                      {msg.message.length > 60 ? "..." : ""}
                    </div>
                  </td>
                  <td>
                    <code className="cron-display">{msg.cronExpression}</code>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`toggle ${msg.enabled ? "active" : ""}`}
                      onClick={() => handleToggle(msg.id, msg.enabled)}
                      aria-label={msg.enabled ? "Disable" : "Enable"}
                    />
                  </td>
                  <td>
                    <div className="actions-cell">
                      <Link to={`/messages/${msg.id}`} className="btn btn-ghost btn-sm">
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(msg.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
