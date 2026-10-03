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

function HealthHistory() {
  const navigate = useNavigate();

  const [history, setHistory] = useState<HealthReading[]>([]);

  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
  );

  useEffect(() => {
    if (!loggedInUser) {
      navigate("/");
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/health-readings/${loggedInUser.id}`
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(data);
          return;
        }

        setHistory(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    fetchHistory();
  }, [navigate, loggedInUser?.id]);

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

  return (
    <div className="app">
      <header className="top-header">
        <div className="logo">
          <div className="logo-icon">+</div>
          FHIR Telehealth
        </div>

        <div className="header-right">
          <div className="user-info">
            <div className="user-avatar">
              {loggedInUser?.name
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <span className="user-name">
              {loggedInUser?.name}
            </span>
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
          <div className="page-header">
            <h1>Health History</h1>

            <p>
              Review your previously recorded health
              measurements.
            </p>
          </div>

          {history.length === 0 ? (
            <div className="card empty-state">
              <h3>No health readings yet</h3>

              <p>
                Your recorded measurements will appear
                here.
              </p>

              <button
                className="primary-button"
                onClick={() => navigate("/monitoring")}
              >
                Add Health Reading
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="health-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Condition</th>
                    <th>Measurements</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {new Date(
                          item.recorded_at
                        ).toLocaleString()}
                      </td>

                      <td>
                        <strong>
                          {item.condition
                            .charAt(0)
                            .toUpperCase() +
                            item.condition.slice(1)}
                        </strong>
                      </td>

                      <td>
                        {Object.entries(
                          item.readings
                        ).map(([name, value]) => (
                          <div key={name}>
                            <strong>
                              {labels[name] || name}:
                            </strong>{" "}
                            {value}{" "}
                            {units[name] || ""}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="action-row">
            <button
              className="primary-button"
              onClick={() => navigate("/monitoring")}
            >
              Add New Reading
            </button>

            <button
              className="secondary-button"
              onClick={() => navigate("/trends")}
            >
              View Health Trends
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default HealthHistory;