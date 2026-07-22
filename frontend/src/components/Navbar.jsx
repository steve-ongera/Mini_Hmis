import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <nav className="navbar app-navbar bg-white border-bottom px-3 px-md-4">
      <button
        className="btn btn-sm btn-outline-secondary d-lg-none"
        type="button"
        onClick={() => document.body.classList.toggle("sidebar-open")}
        aria-label="Toggle sidebar"
      >
        <i className="bi bi-list"></i>
      </button>

      <span className="navbar-title d-none d-lg-block">Hospital Management System</span>

      <div className="d-flex align-items-center ms-auto">
        <div className="d-flex align-items-center me-3">
          <i className="bi bi-person-circle fs-5 me-2 text-secondary"></i>
          <span className="small text-muted">{user?.username || "User"}</span>
        </div>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            <>
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </>
          )}
        </button>
      </div>
    </nav>
  );
}