import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
  );

  useEffect(() => {
    if (!loggedInUser) {
      navigate("/");
      return;
    }

    const role = (loggedInUser.role || "").toLowerCase().trim();
    if (role === "doctor") {
      navigate("/doctor");
      return;
    }
    if (role === "patient") {
      navigate("/dashboard");
      return;
    }

    // Fetch doctors/users summary
    const fetchAdminData = async () => {
      try {
        const res = await fetch("/api/doctors");
        if (res.ok) {
          const docs = await res.json();
          setUsers(docs);
        }
      } catch (err) {
        console.error("Admin data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate, loggedInUser]);

  return (
    <div className="app">
      <header className="top-header">
        <div className="logo">
          <div className="logo-icon">+</div>
          <div>
            <div className="logo-text">FHIR Telehealth</div>
            <div className="logo-subtext">Admin Control Center</div>
          </div>
        </div>

        <div className="header-actions">
          <div className="user-info">
            <div className="user-avatar" style={{ background: "#7c3aed" }}>
              A
            </div>
            <div>
              <div className="user-name">{loggedInUser?.name || "Administrator"}</div>
              <small className="user-role">System Admin</small>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={() => {
              localStorage.removeItem("loggedInUser");
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "1200px", margin: "30px auto", padding: "0 20px" }}>
        <div className="doctor-header" style={{ marginBottom: "24px" }}>
          <div>
            <div className="section-kicker">ADMINISTRATION</div>
            <h1>Platform Administration</h1>
            <p>Manage system roles, verified clinicians, and platform status.</p>
          </div>
        </div>

        <div className="dashboard-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "30px" }}>
          <div className="stat-card">
            <div className="stat-label">Active Doctors</div>
            <div className="stat-value">{users.length || 2}</div>
            <div className="stat-hint">Licensed Clinicians</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">System Role</div>
            <div className="stat-value" style={{ fontSize: "20px", color: "#7c3aed" }}>
              ADMINISTRATOR
            </div>
            <div className="stat-hint">Full Privileges</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">FHIR Gateway</div>
            <div className="stat-value" style={{ color: "#16a34a" }}>
              ONLINE
            </div>
            <div className="stat-hint">HL7 FHIR R4 Ready</div>
          </div>
        </div>

        <div className="doctor-section-card">
          <div className="doctor-section-header">
            <div>
              <h2>Verified Clinicians</h2>
              <p>Registered medical staff with diagnostic access</p>
            </div>
          </div>

          {loading ? (
            <p style={{ padding: "20px" }}>Loading clinicians...</p>
          ) : (
            <div style={{ padding: "10px 20px 20px" }}>
              {users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    margin: "8px 0",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "15px", display: "block" }}>{u.name}</strong>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>{u.email}</span>
                  </div>
                  <span
                    style={{
                      background: "#e0f2fe",
                      color: "#0369a1",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Verified Doctor
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
