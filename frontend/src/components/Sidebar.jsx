import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
  { to: "/patients", label: "Patients", icon: "bi-people" },
  { to: "/doctors", label: "Doctors", icon: "bi-person-badge" },
  { to: "/appointments", label: "Appointments", icon: "bi-calendar-check" },
];

export default function Sidebar() {
  const closeOnMobile = () => document.body.classList.remove("sidebar-open");

  return (
    <>
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <i className="bi bi-hospital"></i>
          <span>HMS</span>
        </div>

        <nav className="nav flex-column sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeOnMobile}
              className={({ isActive }) =>
                "nav-link sidebar-link" + (isActive ? " active" : "")
              }
            >
              <i className={`bi ${item.icon} me-2`}></i>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Backdrop for mobile off-canvas sidebar */}
      <div className="sidebar-backdrop" onClick={closeOnMobile}></div>
    </>
  );
}