import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWhatsApp } from "../hooks/useWhatsApp";
import { Footer } from "./Footer";
import "./Layout.css";

export function Layout() {
  const { user, logout } = useAuth();
  const { status } = useWhatsApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">📱</span>
            <span className="logo-text">WA Scheduler</span>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} end>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink
            to="/connect"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">🔗</span>
            <span className="nav-label">Connection</span>
            <span className={`status-dot ${status === "connected" ? "connected" : ""}`} />
          </NavLink>
          <NavLink
            to="/messages"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">📬</span>
            <span className="nav-label">Messages</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-content">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
}
