import { useNavigate, useLocation } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: "Dashboard",
      icon: "▣",
      path: "/dashboard",
    },
    {
      label: "Health Monitoring",
      icon: "♥",
      path: "/monitoring",
    },
    {
      label: "Health History",
      icon: "◷",
      path: "/history",
    },
    {
      label: "Health Trends",
      icon: "↗",
      path: "/trends",
    },
    {
  label: "Appointments",
  icon: "▣",
  path: "/appointments",
},
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-title">
        Patient Portal
      </div>

      {menuItems.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${
            location.pathname === item.path
              ? "active"
              : ""
          }`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">
            {item.icon}
          </span>

          <span>{item.label}</span>
        </button>
      ))}
    </aside>
  );
}

export default Sidebar;