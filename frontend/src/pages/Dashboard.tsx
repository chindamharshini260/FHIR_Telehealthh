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

  const [latest, setLatest] =
    useState<HealthReading | null>(null);

  const [count, setCount] = useState(0);

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

        setCount(data.length);

        if (data.length > 0) {
          setLatest(data[0]);
        }
      } catch (error) {
        console.error(
          "Error fetching health readings:",
          error
        );
      }
    };

    fetchReadings();
  }, [navigate, loggedInUser?.id]);

  const getInitial = () => {
    if (!loggedInUser?.name) return "P";

    return loggedInUser.name
      .charAt(0)
      .toUpperCase();
  };

  return (
    <div className="app">

      {/* Header */}
      <header className="top-header">

        <div className="logo">
          <div className="logo-icon">
            +
          </div>

          FHIR Telehealth
        </div>

        <div className="header-right">

          <div className="user-info">

            <div className="user-avatar">
              {getInitial()}
            </div>

            <span className="user-name">
              {loggedInUser?.name}
            </span>

          </div>

          <button
            className="logout-button"
            onClick={() => {
              localStorage.removeItem(
                "loggedInUser"
              );

              navigate("/");
            }}
          >
            Logout
          </button>

        </div>

      </header>

      <div className="dashboard-layout">

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="main-content">

          <div className="page-header">

            <h1>
              Good morning,{" "}
              {loggedInUser?.name?.split(" ")[0]} 👋
            </h1>

            <p>
              Here's your health overview.
            </p>

          </div>

          {/* Statistics */}
          <div className="stats-grid">

            <div className="stat-card">

              <div className="stat-label">
                Total Readings
              </div>

              <div className="stat-value">
                {count}
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-label">
                Current Condition
              </div>

              <div className="stat-value">
                {latest
                  ? latest.condition
                  : "None"}
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-label">
                Latest Reading
              </div>

              <div className="stat-value">
                {latest
                  ? new Date(
                      latest.recorded_at
                    ).toLocaleDateString()
                  : "--"}
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-label">
                Health Status
              </div>

              <div className="stat-value">

                <span className="status-badge status-low">
                  Monitoring
                </span>

              </div>

            </div>

          </div>

          {/* Latest Reading */}
          <div className="card">

            <h2>
              Latest Health Reading
            </h2>

            {!latest ? (

              <div className="empty-state">

                <h3>
                  No readings yet
                </h3>

                <p>
                  Start monitoring your health
                  by adding your first reading.
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    navigate("/monitoring")
                  }
                >
                  Add Health Reading
                </button>

              </div>

            ) : (

              <>
                <p>
                  <strong>
                    Condition:
                  </strong>{" "}
                  {latest.condition}
                </p>

                <p>
                  <strong>
                    Recorded:
                  </strong>{" "}
                  {new Date(
                    latest.recorded_at
                  ).toLocaleString()}
                </p>

                <div className="reading-grid">

                  {Object.entries(
                    latest.readings
                  ).map(
                    ([name, value]) => {

                      const labels: Record<
                        string,
                        string
                      > = {
                        glucose:
                          "Blood Glucose",
                        hba1c:
                          "HbA1c",
                        weight:
                          "Weight",
                        systolic:
                          "Systolic BP",
                        diastolic:
                          "Diastolic BP",
                        heartRate:
                          "Heart Rate",
                        spo2:
                          "SpO₂",
                        respiratoryRate:
                          "Respiratory Rate",
                      };

                      const units: Record<
                        string,
                        string
                      > = {
                        glucose:
                          "mg/dL",
                        hba1c:
                          "%",
                        weight:
                          "kg",
                        systolic:
                          "mmHg",
                        diastolic:
                          "mmHg",
                        heartRate:
                          "BPM",
                        spo2:
                          "%",
                        respiratoryRate:
                          "breaths/min",
                      };

                      return (
                        <div
                          className="reading-item"
                          key={name}
                        >

                          <div className="reading-label">
                            {labels[name] ||
                              name}
                          </div>

                          <div className="reading-value">
                            {value}
                            <span className="stat-unit">
                              {units[name] ||
                                ""}
                            </span>
                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              </>

            )}

          </div>

          {/* Quick Actions */}
          <div className="card">

            <h2>
              Quick Actions
            </h2>

            <div className="action-row">

              <button
                className="primary-button"
                onClick={() =>
                  navigate("/monitoring")
                }
              >
                Add New Reading
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  navigate("/history")
                }
              >
                View History
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  navigate("/trends")
                }
              >
                View Trends
              </button>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}

export default Dashboard;