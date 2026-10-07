import { useEffect, useMemo, useState } from "react";
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

type TrendOption = {
  condition: string;
  field: string;
  label: string;
  unit: string;
};

function HealthTrends() {
  const navigate = useNavigate();

  const [history, setHistory] = useState<HealthReading[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTrend, setSelectedTrend] =
    useState("hypertension-systolic");

  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
  );

  // ==========================================
  // FETCH HISTORY
  // ==========================================

  useEffect(() => {
    if (!loggedInUser) {
      navigate("/");
      return;
    }

    if (loggedInUser.role !== "patient") {
      navigate("/doctor");
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
        console.error(
          "Error fetching health trends:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate, loggedInUser?.id]);

  // ==========================================
  // TREND OPTIONS
  // ==========================================

  const trendOptions: TrendOption[] = [
    {
      condition: "hypertension",
      field: "systolic",
      label: "Systolic BP",
      unit: "mmHg",
    },
    {
      condition: "hypertension",
      field: "diastolic",
      label: "Diastolic BP",
      unit: "mmHg",
    },
    {
      condition: "hypertension",
      field: "heartRate",
      label: "Heart Rate",
      unit: "BPM",
    },
    {
      condition: "diabetes",
      field: "glucose",
      label: "Blood Glucose",
      unit: "mg/dL",
    },
    {
      condition: "diabetes",
      field: "hba1c",
      label: "HbA1c",
      unit: "%",
    },
    {
      condition: "diabetes",
      field: "weight",
      label: "Weight",
      unit: "kg",
    },
    {
      condition: "COPD",
      field: "spo2",
      label: "SpO₂",
      unit: "%",
    },
    {
      condition: "COPD",
      field: "respiratoryRate",
      label: "Respiratory Rate",
      unit: "breaths/min",
    },
    {
      condition: "COPD",
      field: "heartRate",
      label: "Heart Rate",
      unit: "BPM",
    },
    {
      condition: "heart_disease",
      field: "systolic",
      label: "Systolic BP",
      unit: "mmHg",
    },
    {
      condition: "heart_disease",
      field: "diastolic",
      label: "Diastolic BP",
      unit: "mmHg",
    },
    {
      condition: "heart_disease",
      field: "heartRate",
      label: "Heart Rate",
      unit: "BPM",
    },
    {
      condition: "heart_disease",
      field: "spo2",
      label: "SpO₂",
      unit: "%",
    },
    {
      condition: "asthma",
      field: "spo2",
      label: "SpO₂",
      unit: "%",
    },
    {
      condition: "asthma",
      field: "respiratoryRate",
      label: "Respiratory Rate",
      unit: "breaths/min",
    },
    {
      condition: "asthma",
      field: "peakFlow",
      label: "Peak Flow",
      unit: "L/min",
    },
    {
      condition: "CKD",
      field: "creatinine",
      label: "Creatinine",
      unit: "mg/dL",
    },
    {
      condition: "CKD",
      field: "egfr",
      label: "eGFR",
      unit: "mL/min",
    },
    {
      condition: "CKD",
      field: "systolic",
      label: "Systolic BP",
      unit: "mmHg",
    },
    {
      condition: "obesity",
      field: "weight",
      label: "Weight",
      unit: "kg",
    },
    {
      condition: "obesity",
      field: "height",
      label: "Height",
      unit: "cm",
    },
    {
      condition: "obesity",
      field: "bmi",
      label: "BMI",
      unit: "kg/m²",
    },
    {
      condition: "thyroid",
      field: "tsh",
      label: "TSH",
      unit: "mIU/L",
    },
    {
      condition: "thyroid",
      field: "t3",
      label: "T3",
      unit: "ng/dL",
    },
    {
      condition: "thyroid",
      field: "t4",
      label: "T4",
      unit: "µg/dL",
    },
  ];

  // ==========================================
  // AVAILABLE TRENDS
  // Only show trends for which data exists
  // ==========================================

  const availableTrends = useMemo(() => {
    return trendOptions.filter((option) =>
      history.some(
        (item) =>
          item.condition.toLowerCase() ===
            option.condition.toLowerCase() &&
          item.readings[option.field] !==
            undefined &&
          item.readings[option.field] !== ""
      )
    );
  }, [history]);

  // ==========================================
  // SELECTED TREND
  // ==========================================

  const selectedOption =
    trendOptions.find(
      (option) =>
        `${option.condition}-${option.field}` ===
        selectedTrend
    ) ||
    availableTrends[0] ||
    trendOptions[0];

  // ==========================================
  // CHART DATA
  // ==========================================

  const chartData = useMemo(() => {
    if (!selectedOption) {
      return [];
    }

    return history
      .filter(
        (item) =>
          item.condition.toLowerCase() ===
            selectedOption.condition.toLowerCase() &&
          item.readings[
            selectedOption.field
          ] !== undefined &&
          item.readings[
            selectedOption.field
          ] !== ""
      )
      .map((item) => ({
        date: new Date(
          item.recorded_at
        ).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
        }),

        fullDate: new Date(
          item.recorded_at
        ).toLocaleString(),

        value: Number(
          item.readings[
            selectedOption.field
          ]
        ),
      }))
      .reverse();
  }, [history, selectedOption]);

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

        <main className="main-content trends-page">

          {/* ================= HEADER ================= */}

          <div className="trends-header">

            <div>

              <div className="section-kicker">
                HEALTH ANALYTICS
              </div>

              <h1>
                Health Trends
              </h1>

              <p>
                Track changes in your health
                measurements over time.
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

          {/* ================= LOADING ================= */}

          {loading && (

            <div className="dashboard-panel">

              <div className="trends-empty">

                <div className="trends-empty-icon">
                  ↗
                </div>

                <h3>
                  Loading health trends...
                </h3>

                <p>
                  Please wait while your
                  measurements are loaded.
                </p>

              </div>

            </div>

          )}

          {/* ================= NO DATA ================= */}

          {!loading &&
            availableTrends.length === 0 && (

              <div className="dashboard-panel">

                <div className="trends-empty">

                  <div className="trends-empty-icon">
                    ↗
                  </div>

                  <h3>
                    Not enough data
                  </h3>

                  <p>
                    Add health readings to see
                    your measurements over time.
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

          {/* ================= TRENDS ================= */}

          {!loading &&
            availableTrends.length > 0 && (

              <>

                {/* TREND SELECTOR */}

                <div className="trend-selector-card">

                  <div>

                    <span className="trend-selector-label">
                      SELECT MEASUREMENT
                    </span>

                    <h2>
                      {selectedOption.label}
                    </h2>

                    <p>
                      {getConditionName(
                        selectedOption.condition
                      )}
                    </p>

                  </div>

                  <select
                    value={
                      availableTrends.some(
                        (option) =>
                          `${option.condition}-${option.field}` ===
                          selectedTrend
                      )
                        ? selectedTrend
                        : `${availableTrends[0].condition}-${availableTrends[0].field}`
                    }
                    onChange={(e) =>
                      setSelectedTrend(
                        e.target.value
                      )
                    }
                  >

                    {availableTrends.map(
                      (option) => (

                        <option
                          key={`${option.condition}-${option.field}`}
                          value={`${option.condition}-${option.field}`}
                        >
                          {getConditionName(
                            option.condition
                          )}{" "}
                          —{" "}
                          {option.label}
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* CHART */}

                <div className="trend-chart-card">

                  <div className="trend-chart-header">

                    <div>

                      <h2>
                        {selectedOption.label}
                      </h2>

                      <p>
                        {getConditionName(
                          selectedOption.condition
                        )}{" "}
                        ·{" "}
                        {selectedOption.unit}
                      </p>

                    </div>

                    <div className="trend-data-count">

                      <span>
                        Records
                      </span>

                      <strong>
                        {chartData.length}
                      </strong>

                    </div>

                  </div>

                  {chartData.length < 2 ? (

                    <div className="trends-small-data">

                      <div className="trends-empty-icon">
                        ◷
                      </div>

                      <h3>
                        Add more readings
                      </h3>

                      <p>
                        At least two readings
                        are needed to display
                        a meaningful trend line.
                      </p>

                      <button
                        className="primary-button"
                        onClick={() =>
                          navigate(
                            "/monitoring"
                          )
                        }
                      >
                        Add Reading
                      </button>

                    </div>

                  ) : (

                    <div className="trend-chart-wrapper">

                      <ResponsiveContainer
                        width="100%"
                        height={390}
                      >

                        <LineChart
                          data={chartData}
                          margin={{
                            top: 10,
                            right: 20,
                            left: 0,
                            bottom: 10,
                          }}
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                          />

                          <XAxis
                            dataKey="date"
                            tick={{
                              fontSize: 11,
                            }}
                          />

                          <YAxis
                            tick={{
                              fontSize: 11,
                            }}
                          />

                          <Tooltip
                            formatter={(
                              value
                            ) => [
                              `${value} ${selectedOption.unit}`,
                              selectedOption.label,
                            ]}
                            labelFormatter={(
                              label,
                              payload
                            ) => {
                              const item =
                                payload?.[0]
                                  ?.payload;

                              return (
                                item?.fullDate ||
                                label
                              );
                            }}
                          />

                          <Legend />

                          <Line
                            type="monotone"
                            dataKey="value"
                            name={`${selectedOption.label} (${selectedOption.unit})`}
                            strokeWidth={3}
                            dot={{
                              r: 4,
                            }}
                            activeDot={{
                              r: 6,
                            }}
                          />

                        </LineChart>

                      </ResponsiveContainer>

                    </div>

                  )}

                </div>

                {/* QUICK TREND CARDS */}

                <div className="trend-overview-grid">

                  {availableTrends
                    .slice(0, 6)
                    .map((option) => {

                      const data =
                        history.filter(
                          (item) =>
                            item.condition.toLowerCase() ===
                              option.condition.toLowerCase() &&
                            item.readings[
                              option.field
                            ] !== undefined
                        );

                      const latest =
                        data.length > 0
                          ? data[0].readings[
                              option.field
                            ]
                          : "-";

                      return (

                        <button
                          className="trend-overview-card"
                          key={`${option.condition}-${option.field}`}
                          onClick={() =>
                            setSelectedTrend(
                              `${option.condition}-${option.field}`
                            )
                          }
                        >

                          <span>
                            {option.label}
                          </span>

                          <strong>
                            {latest}
                          </strong>

                          <small>
                            {option.unit}
                          </small>

                          <em>
                            {
                              getConditionName(
                                option.condition
                              )
                            }
                          </em>

                        </button>

                      );

                    })}

                </div>

              </>

            )}

          {/* ================= ACTIONS ================= */}

          {!loading && (

            <div className="trends-actions">

              <button
                className="secondary-button"
                onClick={() =>
                  navigate("/history")
                }
              >
                ← View Health History
              </button>

              <button
                className="primary-button"
                onClick={() =>
                  navigate("/monitoring")
                }
              >
                + Add New Reading
              </button>

            </div>

          )}

        </main>

      </div>

    </div>
  );
}

export default HealthTrends;