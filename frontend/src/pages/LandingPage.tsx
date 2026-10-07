import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-container">

        <div className="landing-header">
          <div className="landing-logo">
            <div className="landing-logo-icon">+</div>

            <div>
              <h1>FHIR Telehealth</h1>
              <p>Remote Healthcare Platform</p>
            </div>
          </div>

          <div className="landing-badge">
            FHIR Enabled
          </div>
        </div>

        <div className="landing-content">
          <div className="landing-kicker">
            SECURE DIGITAL HEALTHCARE
          </div>

          <h2>
            Healthcare, connected
            <br />
            <span>for everyone.</span>
          </h2>

          <p className="landing-description">
            Access health monitoring, clinical records,
            appointments and intelligent decision-support
            tools through one secure platform.
          </p>

          <div className="login-title">
            Choose your portal
          </div>

          <div className="portal-grid">

            {/* DOCTOR */}
            <div className="portal-card">
              <div className="portal-icon doctor-icon">
                👨‍⚕️
              </div>

              <h3>Doctor</h3>

              <p>
                Monitor patients, review health records,
                appointments and clinical insights.
              </p>

              <button
                className="portal-button"
                onClick={() => navigate("/login?role=doctor")}
              >
                Doctor Login →
              </button>
            </div>

            {/* PATIENT */}
            <div className="portal-card">
              <div className="portal-icon patient-icon">
                🧑
              </div>

              <h3>Patient</h3>

              <p>
                Track your health, submit readings,
                view history and manage appointments.
              </p>

              <button
                className="portal-button"
                onClick={() => navigate("/login?role=patient")}
              >
                Patient Login →
              </button>
            </div>

            {/* ADMIN */}
            <div className="portal-card">
              <div className="portal-icon admin-icon">
                🛡️
              </div>

              <h3>Admin</h3>

              <p>
                Manage users, doctors, approvals and
                platform administration.
              </p>

              <button
                className="portal-button"
               onClick={() => alert("Admin login coming next")}
              >
                Admin Login →
              </button>
            </div>

          </div>
        </div>

        <div className="landing-footer">
          <span>🔒 Secure</span>
          <span>•</span>
          <span>FHIR Interoperable</span>
          <span>•</span>
          <span>Clinical Decision Support</span>
        </div>

      </div>
    </div>
  );
}

export default LandingPage;