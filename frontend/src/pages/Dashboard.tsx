import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

type HealthReading = {
  id: string;
  patient_id: string;
  condition: string;
  readings: Record<string, string>;
  recorded_at: string;
};

function Dashboard() {
  const navigate = useNavigate();

  const [readings, setReadings] = useState<HealthReading[]>([]);

  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
  );

  useEffect(() => {
    if (!loggedInUser) {
      navigate("/");
      return;
    }

    const fetchReadings = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/health-readings/${loggedInUser.id}`
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(data);
          return;
        }

        setReadings(data);
      } catch (error) {
        console.error("Error fetching health readings:", error);
      }
    };

    fetchReadings();
  }, [navigate, loggedInUser?.id]);

  const latest = readings[0];

  const getInitial = () => {
    if (!loggedInUser?.name) return "P";

    return loggedInUser.name.charAt(0).toUpperCase();
  };

  const getLabel = (name: string) => {
    const labels: Record<string, string> = {
      glucose: "Blood Glucose",
      hba1c: "HbA1c",
      weight: "Weight",
      systolic: "Systolic BP",
      diastolic: "Diastolic BP",
      heartRate: "Heart Rate",
      spo2: "SpO₂",
      respiratoryRate: "Respiratory Rate",
    };

    return labels[name] || name;
  };

  const getUnit = (name: string) => {
    const units: Record<string, string> = {
      glucose: "mg/dL",
      hba1c: "%",
      weight: "kg",
      systolic: "mmHg",
      diastolic: "mmHg",
      heartRate: "BPM",
      spo2: "%",
      respiratoryRate: "breaths/min",
    };

    return units[name] || "";
  };

  const getConditionIcon = (condition: string) => {
    const value = condition.toLowerCase();

    if (value === "hypertension") return "♥";
    if (value === "diabetes") return "●";
    if (value === "copd") return "♢";

    return "✚";
  };

  const getRisk = () => {
    if (!latest) return "Not Available";

    const condition = latest.condition.toLowerCase();
    const data = latest.readings;

    if (condition === "hypertension") {
      const systolic = Number(data.systolic);
      const diastolic = Number(data.diastolic);

      if (systolic >= 140 || diastolic >= 90) {
        return "High";
      }

      if (systolic >= 130 || diastolic >= 80) {
        return "Moderate";
      }

      return "Low";
    }

    if (condition === "diabetes") {
      const glucose = Number(data.glucose);

      if (glucose >= 200) return "High";
      if (glucose >= 140) return "Moderate";

      return "Low";
    }

    if (condition === "copd") {
      const spo2 = Number(data.spo2);
      const respiratoryRate = Number(data.respiratoryRate);

      if (spo2 < 92 || respiratoryRate > 24) {
        return "High";
      }

      if (spo2 < 95 || respiratoryRate > 20) {
        return "Moderate";
      }

      return "Low";
    }

    return "Monitoring";
  };

  const risk = getRisk();

  return (
    <div className="app">

      {/* HEADER */}
      <header className="top-header">

        <div className="logo">
          <div className="logo-icon">+</div>
          <div>
            <div>FHIR Telehealth</div>
            <small>Remote Healthcare</small>
          </div>
        </div>

        <div className="header-right">

          <div className="user-info">
            <div className="user-avatar">
              {getInitial()}
            </div>

            <div>
              <div className="user-name">
                {loggedInUser?.name}
              </div>

              <small className="user-role">
                Patient
              </small>
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

      <div className="dashboard-layout">

        <Sidebar />

        <main className="main-content">

          {/* PAGE TITLE */}
          <div className="page-header dashboard-page-title">

            <div>
              <h1>
                Welcome,{" "}
                {loggedInUser?.name?.split(" ")[0]}!
              </h1>

              <p>
                Here's your health overview for today.
              </p>
            </div>

            <button
              className="primary-button dashboard-monitor-btn"
              onClick={() => navigate("/monitoring")}
            >
              + Enter Today's Reading
            </button>

          </div>

          {/* HEALTH SUMMARY */}
          <div className="dashboard-summary-grid">

            <div className="dashboard-stat-card">

              <div className="dashboard-stat-icon blue">
                ♥
              </div>

              <div>
                <span>Health Readings</span>
                <strong>{readings.length}</strong>
                <small>Total recorded</small>
              </div>

            </div>

            <div className="dashboard-stat-card">

              <div className="dashboard-stat-icon teal">
                ♡
              </div>

              <div>
                <span>Active Condition</span>
                <strong>
                  {latest
                    ? latest.condition
                    : "None"}
                </strong>
                <small>Currently monitored</small>
              </div>

            </div>

            <div className="dashboard-stat-card">

              <div className="dashboard-stat-icon green">
                ✓
              </div>

              <div>
                <span>Risk Status</span>

                <strong
                  className={
                    risk === "High"
                      ? "risk-text-high"
                      : risk === "Moderate"
                      ? "risk-text-moderate"
                      : "risk-text-low"
                  }
                >
                  {risk}
                </strong>

                <small>
                  Based on latest reading
                </small>
              </div>

            </div>

            <div className="dashboard-stat-card">

              <div className="dashboard-stat-icon purple">
                ◷
              </div>

              <div>
                <span>Last Updated</span>

                <strong>
                  {latest
                    ? new Date(
                        latest.recorded_at
                      ).toLocaleDateString()
                    : "--"}
                </strong>

                <small>
                  Latest health record
                </small>
              </div>

            </div>

          </div>

          {/* CONDITIONS + RISK */}
          <div className="dashboard-two-column">

            {/* ACTIVE CONDITIONS */}
            <div className="dashboard-panel">

              <div className="panel-heading">

                <div>
                  <h2>My Health Conditions</h2>
                  <p>
                    Conditions currently being monitored
                  </p>
                </div>

                <button
                  className="text-button"
                  onClick={() =>
                    navigate("/conditions")
                  }
                >
                  Manage
                </button>

              </div>

              <div className="condition-cards">

                {["hypertension", "diabetes", "COPD"].map(
                  (condition) => {

                    const exists = readings.some(
                      (item) =>
                        item.condition.toLowerCase() ===
                        condition.toLowerCase()
                    );

                    return (
                      <div
                        className={`condition-card ${
                          exists ? "condition-active" : ""
                        }`}
                        key={condition}
                      >

                        <div className="condition-icon">
                          {getConditionIcon(condition)}
                        </div>

                        <div>
                          <strong>
                            {condition === "COPD"
                              ? "COPD"
                              : condition.charAt(0).toUpperCase() +
                                condition.slice(1)}
                          </strong>

                          <span>
                            {exists
                              ? "Active Monitoring"
                              : "Not monitored yet"}
                          </span>
                        </div>

                        <div
                          className={
                            exists
                              ? "condition-check"
                              : "condition-dot"
                          }
                        >
                          {exists ? "✓" : ""}
                        </div>

                      </div>
                    );
                  }
                )}

              </div>

              <button
                className="secondary-button full-width-button"
                onClick={() => navigate("/conditions")}
              >
                + Add / Manage Conditions
              </button>

            </div>

            {/* RISK */}
            <div className="dashboard-panel risk-panel">

              <div className="panel-heading">
                <div>
                  <h2>Current Health Risk</h2>
                  <p>
                    Based on your latest reading
                  </p>
                </div>
              </div>

              <div
                className={`risk-display ${
                  risk === "High"
                    ? "risk-high"
                    : risk === "Moderate"
                    ? "risk-moderate"
                    : "risk-low"
                }`}
              >

                <div className="risk-circle">
                  {risk === "High"
                    ? "!"
                    : risk === "Moderate"
                    ? "!"
                    : "✓"}
                </div>

                <div>
                  <span>Current Risk</span>
                  <strong>{risk}</strong>
                </div>

              </div>

              <p className="risk-description">
                {risk === "High"
                  ? "Your latest reading is above the configured high-risk threshold."
                  : risk === "Moderate"
                  ? "Your latest reading requires continued monitoring."
                  : risk === "Low"
                  ? "Your latest reading is within the configured low-risk range."
                  : "Enter a health reading to calculate your current risk."}
              </p>

              <button
                className="secondary-button full-width-button"
                onClick={() => navigate("/monitoring")}
              >
                View Health Monitoring
              </button>

            </div>

          </div>

          {/* LATEST READING */}
          <div className="dashboard-panel latest-reading-panel">

            <div className="panel-heading">

              <div>
                <h2>Latest Health Reading</h2>

                <p>
                  {latest
                    ? `${latest.condition} • ${new Date(
                        latest.recorded_at
                      ).toLocaleString()}`
                    : "No health readings recorded yet"}
                </p>
              </div>

              <button
                className="text-button"
                onClick={() => navigate("/history")}
              >
                View History →
              </button>

            </div>

            {!latest ? (

              <div className="dashboard-empty">

                <div className="empty-icon">
                  +
                </div>

                <div>
                  <strong>
                    No readings yet
                  </strong>

                  <p>
                    Start monitoring your health
                    by entering today's reading.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() =>
                    navigate("/monitoring")
                  }
                >
                  Start Monitoring
                </button>

              </div>

            ) : (

              <div className="latest-reading-grid">

                {Object.entries(
                  latest.readings
                ).map(([name, value]) => (

                  <div
                    className="latest-reading-item"
                    key={name}
                  >

                    <span>
                      {getLabel(name)}
                    </span>

                    <strong>
                      {value}
                      <small>
                        {getUnit(name)}
                      </small>
                    </strong>

                  </div>

                ))}

              </div>

            )}

          </div>

          {/* QUICK ACTIONS */}
          <div className="quick-actions-panel">

            <div>
              <h2>Today's Health Tasks</h2>
              <p>
                Keep your health information up to date.
              </p>
            </div>

            <div className="quick-action-buttons">

              <button
                className="primary-button"
                onClick={() =>
                  navigate("/monitoring")
                }
              >
                Enter Health Reading
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  navigate("/trends")
                }
              >
                View Trends
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  navigate("/appointments")
                }
              >
                Book Appointment
              </button>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}

export default Dashboard;