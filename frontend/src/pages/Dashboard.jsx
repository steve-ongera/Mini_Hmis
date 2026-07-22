import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../services/api";

const STAT_CARDS = [
  { key: "total_doctors", label: "Active Doctors", icon: "bi-person-badge", color: "primary", link: "/doctors" },
  { key: "total_patients", label: "Total Patients", icon: "bi-people", color: "success", link: "/patients" },
  { key: "scheduled_appointments", label: "Scheduled", icon: "bi-calendar-check", color: "info", link: "/appointments" },
  { key: "unassigned_patients", label: "Unassigned Patients", icon: "bi-person-exclamation", color: "warning", link: "/patients?unassigned=true" },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getDashboardStats();
        if (isMounted) setStats(response.data.data);
      } catch (err) {
        if (isMounted) {
          setError("Couldn't load dashboard stats. Please try again.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted mt-3">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
        <span>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </span>
        <button className="btn btn-sm btn-outline-danger" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="h3 mb-4">Dashboard</h1>

      <div className="row g-3 mb-4">
        {STAT_CARDS.map((card) => (
          <div className="col-12 col-sm-6 col-lg-3" key={card.key}>
            <Link to={card.link} className="text-decoration-none">
              <div className={`card border-0 shadow-sm stat-card stat-card-${card.color}`}>
                <div className="card-body d-flex align-items-center">
                  <div className={`stat-icon bg-${card.color}-subtle text-${card.color} me-3`}>
                    <i className={`bi ${card.icon}`}></i>
                  </div>
                  <div>
                    <div className="fs-4 fw-semibold">{stats?.[card.key] ?? 0}</div>
                    <div className="text-muted small">{card.label}</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h2 className="h6 mb-3">Appointment Status</h2>
              <ul className="list-unstyled mb-0">
                <li className="d-flex justify-content-between py-1 border-bottom">
                  <span>Scheduled</span>
                  <span className="fw-semibold">{stats?.scheduled_appointments ?? 0}</span>
                </li>
                <li className="d-flex justify-content-between py-1 border-bottom">
                  <span>Completed</span>
                  <span className="fw-semibold">{stats?.completed_appointments ?? 0}</span>
                </li>
                <li className="d-flex justify-content-between py-1">
                  <span>Cancelled</span>
                  <span className="fw-semibold">{stats?.cancelled_appointments ?? 0}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex flex-column">
              <h2 className="h6 mb-3">Quick Actions</h2>
              <Link to="/patients" className="btn btn-outline-primary btn-sm mb-2">
                <i className="bi bi-person-plus me-1"></i> Add / View Patients
              </Link>
              <Link to="/appointments" className="btn btn-outline-primary btn-sm mb-2">
                <i className="bi bi-calendar-plus me-1"></i> Schedule Appointment
              </Link>
              <Link to="/doctors" className="btn btn-outline-primary btn-sm">
                <i className="bi bi-person-badge me-1"></i> Manage Doctors
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}