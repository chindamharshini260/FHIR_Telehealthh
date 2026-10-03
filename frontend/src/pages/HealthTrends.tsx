import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Sidebar from "../components/Sidebar";

type HealthReading = {
  id: string;
  patient_id: string;
  condition: string;
  readings: Record<string, string>;
  recorded_at: string;
};

function HealthTrends() {
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
        console.error("Error fetching health trends:", error);
      }
    };

    fetchHistory();
  }, [navigate, loggedInUser?.id]);

  const hypertension = history
    .filter(
      (item) =>
        item.condition === "hypertension" &&
        item.readings.systolic &&
        item.readings.diastolic &&
        item.readings.heartRate
    )
    .map((item) => ({
      date: new Date(item.recorded_at).toLocaleDateString(),
      systolic: Number(item.readings.systolic),
      diastolic: Number(item.readings.diastolic),
      heartRate: Number(item.readings.heartRate),
    }))
    .reverse();

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
            <h1>Health Trends</h1>

            <p>
              Track changes in your health measurements
              over time.
            </p>
          </div>

          <div className="card">
            <h2>Blood Pressure & Heart Rate</h2>

            <p>
              Historical hypertension measurements
            </p>

            {hypertension.length === 0 ? (
              <div className="empty-state">
                <h3>
                  Not enough data
                </h3>

                <p>
                  Add hypertension readings to see your
                  health trends.
                </p>

                <button
                  className="primary-button"
                  onClick={() => navigate("/monitoring")}
                >
                  Add Health Reading
                </button>
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 420,
                  marginTop: 25,
                }}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart data={hypertension}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis dataKey="date" />

                    <YAxis />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="systolic"
                      name="Systolic BP"
                      strokeWidth={2}
                    />

                    <Line
                      type="monotone"
                      dataKey="diastolic"
                      name="Diastolic BP"
                      strokeWidth={2}
                    />

                    <Line
                      type="monotone"
                      dataKey="heartRate"
                      name="Heart Rate"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="action-row">
            <button
              className="secondary-button"
              onClick={() => navigate("/history")}
            >
              View Health History
            </button>

            <button
              className="primary-button"
              onClick={() => navigate("/monitoring")}
            >
              Add New Reading
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default HealthTrends;