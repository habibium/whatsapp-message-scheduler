import { Link } from "react-router-dom";
import { useMessages } from "../hooks/useMessages";
import { useWhatsApp } from "../hooks/useWhatsApp";
import "./DashboardPage.css";

export function DashboardPage() {
  const { status } = useWhatsApp();
  const { messages, loading } = useMessages();

  const enabledCount = messages.filter((m) => m.enabled).length;

  return (
    <div className="dashboard animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your WhatsApp scheduler</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔗</div>
          <div className="stat-content">
            <span className="stat-label">WhatsApp Status</span>
            <span className={`stat-value status-${status}`}>
              {status === "connected"
                ? "Connected"
                : status === "awaiting_qr"
                  ? "Awaiting QR"
                  : status === "connecting"
                    ? "Connecting..."
                    : "Disconnected"}
            </span>
          </div>
          {status !== "connected" && (
            <Link to="/connect" className="stat-action">
              Connect →
            </Link>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-icon">📬</div>
          <div className="stat-content">
            <span className="stat-label">Active Schedules</span>
            <span className="stat-value">{loading ? "..." : enabledCount}</span>
          </div>
          <Link to="/messages" className="stat-action">
            Manage →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-label">Total Messages</span>
            <span className="stat-value">{loading ? "..." : messages.length}</span>
          </div>
          <Link to="/messages/new" className="stat-action">
            New →
          </Link>
        </div>
      </div>

      {status !== "connected" && (
        <div className="alert-card">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <h3 className="alert-title">WhatsApp Not Connected</h3>
            <p className="alert-description">
              Connect your WhatsApp account to start sending scheduled messages.
            </p>
          </div>
          <Link to="/connect" className="btn btn-primary">
            Connect Now
          </Link>
        </div>
      )}

      {messages.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3 className="empty-title">No Scheduled Messages</h3>
          <p className="empty-description">Create your first scheduled message to get started.</p>
          <Link to="/messages/new" className="btn btn-primary">
            Create Message
          </Link>
        </div>
      )}

      {messages.length > 0 && (
        <section className="recent-section">
          <h2 className="section-title">Recent Schedules</h2>
          <div className="recent-list">
            {messages.slice(0, 5).map((msg) => (
              <Link to={`/messages/${msg.id}`} key={msg.id} className="recent-item">
                <div className="recent-info">
                  <span className="recent-target">
                    {msg.isGroup ? "👥" : "👤"} {msg.target}
                  </span>
                  <span className="recent-schedule">{msg.cronExpression}</span>
                </div>
                <span
                  className={`status-badge ${msg.enabled ? "status-connected" : "status-disconnected"}`}
                >
                  {msg.enabled ? "Active" : "Paused"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
