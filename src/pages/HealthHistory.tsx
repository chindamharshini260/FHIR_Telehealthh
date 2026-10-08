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
  const [loading, setLoading] = useState(true);

  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
  );

  useEffect(() => {
    if (!loggedInUser) {
      navigate("/");
      return;
    }

    const userRole = (loggedInUser.role || "").toLowerCase().trim();
    if (userRole === "doctor") {
      navigate("/doctor");
      return;
    }
    if (userRole === "admin") {
      navigate("/admin");
      return;
    }
    if (userRole !== "patient") {
      navigate("/");
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch(
          `/api/health-readings/${loggedInUser.id}`
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(data);
          return;
        }

        setHistory(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate, loggedInUser?.id]);

  // ==========================================
  // READING LABELS
  // ==========================================

  const labels: Record<string, string> = {
    glucose: "Blood Glucose",
    hba1c: "HbA1c",
    weight: "Weight",
    height: "Height",
    bmi: "BMI",

    systolic: "Systolic BP",
    diastolic: "Diastolic BP",

    heartRate: "Heart Rate",

    spo2: "SpO₂",

    respiratoryRate: "Respiratory Rate",

    peakFlow: "Peak Flow",

    creatinine: "Creatinine",

    egfr: "eGFR",

    tsh: "TSH",

    t3: "T3",

    t4: "T4",
  };

  // ==========================================
  // UNITS
  // ==========================================

  const units: Record<string, string> = {
    glucose: "mg/dL",
    hba1c: "%",
    weight: "kg",
    height: "cm",
    bmi: "kg/m²",

    systolic: "mmHg",
    diastolic: "mmHg",

    heartRate: "BPM",

    spo2: "%",

    respiratoryRate: "breaths/min",

    peakFlow: "L/min",

    creatinine: "mg/dL",

    egfr: "mL/min",

    tsh: "mIU/L",

    t3: "ng/dL",

    t4: "µg/dL",
  };

  // ==========================================
  // CONDITION NAME
  // ==========================================

  const getConditionName = (
    condition: string
  ) => {
    const value = condition.toLowerCase();

    if (value === "hypertension") {
      return "Hypertension";
    }

    if (value === "diabetes") {
      return "Diabetes";
    }

    if (value === "copd") {
      return "COPD";
    }

    if (value === "heart_disease") {
      return "Heart Disease";
    }

    if (value === "asthma") {
      return "Asthma";
    }

    if (value === "ckd") {
      return "Chronic Kidney Disease";
    }

    if (value === "obesity") {
      return "Obesity";
    }

    if (value === "thyroid") {
      return "Thyroid Disorder";
    }

    return condition;
  };

  // ==========================================
  // CONDITION ICON
  // ==========================================

  const getConditionIcon = (
    condition: string
  ) => {
    const value = condition.toLowerCase();

    if (value === "hypertension") {
      return "♥";
    }

    if (value === "diabetes") {
      return "●";
    }

    if (value === "copd") {
      return "♢";
    }

    if (value === "heart_disease") {
      return "♥";
    }

    if (value === "asthma") {
      return "♨";
    }

    if (value === "ckd") {
      return "◆";
    }

    if (value === "obesity") {
      return "●";
    }

    if (value === "thyroid") {
      return "◇";
    }

    return "+";
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    localStorage.removeItem("loggedInUser");
    navigate("/");
  };

  return (
    <div className="app">

      {/* ================= HEADER ================= */}

      <header className="top-header">

        <div className="logo">

          <div className="logo-icon">
            +
          </div>

          <div>
            <div>
              FHIR Telehealth
            </div>

            <small>
              Remote Healthcare
            </small>
          </div>

        </div>

        <div className="header-right">

          <div className="user-info">

            <div className="user-avatar">
              {loggedInUser?.name
                ?.charAt(0)
                .toUpperCase()}
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
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </header>

      {/* ================= LAYOUT ================= */}

      <div className="dashboard-layout">

        <Sidebar />

        <main className="main-content history-page">

          {/* ================= PAGE HEADER ================= */}

          <div className="history-header">

            <div>

              <div className="section-kicker">
                HEALTH RECORDS
              </div>

              <h1>
                Health History
              </h1>

              <p>
                Review your previously recorded
                health measurements.
              </p>

            </div>

            <button
              className="primary-button"
              onClick={() =>
                navigate("/monitoring")
              }
            >
              + Add New Reading
            </button>

          </div>

          {/* ================= SUMMARY ================= */}

          {!loading && history.length > 0 && (

            <div className="history-summary-grid">

              <div className="history-summary-card">

                <div className="history-summary-icon">
                  ◷
                </div>

                <div>

                  <span>
                    Total Readings
                  </span>

                  <strong>
                    {history.length}
                  </strong>

                </div>

              </div>

              <div className="history-summary-card">

                <div className="history-summary-icon">
                  ♥
                </div>

                <div>

                  <span>
                    Conditions Monitored
                  </span>

                  <strong>
                    {
                      new Set(
                        history.map(
                          (item) =>
                            item.condition
                        )
                      ).size
                    }
                  </strong>

                </div>

              </div>

              <div className="history-summary-card">

                <div className="history-summary-icon">
                  ✓
                </div>

                <div>

                  <span>
                    Latest Record
                  </span>

                  <strong>
                    {history.length > 0
                      ? new Date(
                          history[0].recorded_at
                        ).toLocaleDateString()
                      : "-"}
                  </strong>

                </div>

              </div>

            </div>

          )}

          {/* ================= LOADING ================= */}

          {loading && (

            <div className="dashboard-panel">

              <div className="history-empty">

                <div className="history-empty-icon">
                  ◷
                </div>

                <h3>
                  Loading health history...
                </h3>

                <p>
                  Please wait while your
                  records are loaded.
                </p>

              </div>

            </div>

          )}

          {/* ================= EMPTY ================= */}

          {!loading &&
            history.length === 0 && (

              <div className="dashboard-panel">

                <div className="history-empty">

                  <div className="history-empty-icon">
                    +
                  </div>

                  <h3>
                    No health readings yet
                  </h3>

                  <p>
                    Your recorded measurements
                    will appear here.
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

              </div>

            )}

          {/* ================= HISTORY ================= */}

          {!loading &&
            history.length > 0 && (

              <div className="history-list">

                {history.map((item) => (

                  <div
                    className="history-card"
                    key={item.id}
                  >

                    {/* CARD HEADER */}

                    <div className="history-card-header">

                      <div className="history-condition">

                        <div className="history-condition-icon">
                          {getConditionIcon(
                            item.condition
                          )}
                        </div>

                        <div>

                          <h2>
                            {getConditionName(
                              item.condition
                            )}
                          </h2>

                          <span>
                            Health Reading
                          </span>

                        </div>

                      </div>

                      <div className="history-date">

                        <span>
                          Recorded
                        </span>

                        <strong>
                          {new Date(
                            item.recorded_at
                          ).toLocaleString()}
                        </strong>

                      </div>

                    </div>

                    {/* MEASUREMENTS */}

                    <div className="history-measurements">

                      {Object.entries(
                        item.readings
                      ).map(
                        ([name, value]) => (

                          <div
                            className="history-measurement"
                            key={name}
                          >

                            <span>
                              {labels[name] ||
                                name}
                            </span>

                            <strong>
                              {value}
                            </strong>

                            <small>
                              {units[name] ||
                                ""}
                            </small>

                          </div>

                        )
                      )}

                    </div>

                    {/* FHIR STATUS */}

                    <div className="history-fhir-status">

                      <span className="history-fhir-dot">
                        ✓
                      </span>

                      <span>
                        Reading stored in
                        patient health record
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            )}

          {/* ================= ACTIONS ================= */}

          {!loading &&
            history.length > 0 && (

              <div className="history-actions">

                <button
                  className="primary-button"
                  onClick={() =>
                    navigate("/monitoring")
                  }
                >
                  + Add New Reading
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    navigate("/trends")
                  }
                >
                  View Health Trends →
                </button>

              </div>

            )}

        </main>

      </div>

    </div>
  );
}

export default HealthHistory;