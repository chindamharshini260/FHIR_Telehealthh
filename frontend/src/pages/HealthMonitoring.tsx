import { useEffect, useState } from "react";
import {
  createBloodPressureObservation,
  createGlucoseObservation,
  createCOPDObservations,
} from "../services/fhirService";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

type PatientCondition = {
  id: string;
  condition: string;
  created_at: string;
};

function HealthMonitoring() {
  const navigate = useNavigate();

  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
  );

  const patientId = loggedInUser?.id;
  const patientName = loggedInUser?.name;

  const [conditions, setConditions] = useState<
    PatientCondition[]
  >([]);

  const [readings, setReadings] = useState<
    Record<string, Record<string, string>>
  >({});

  const [loadingConditions, setLoadingConditions] =
    useState(true);

  const [savingCondition, setSavingCondition] =
    useState("");

  useEffect(() => {
    if (!loggedInUser) {
      navigate("/");
      return;
    }

    if (loggedInUser.role !== "patient") {
      navigate("/doctor");
      return;
    }

    fetchConditions();
  }, [navigate, loggedInUser?.id]);

  const fetchConditions = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/patient-conditions/${patientId}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        return;
      }

      setConditions(data);
    } catch (error) {
      console.error(
        "Condition fetch error:",
        error
      );
    } finally {
      setLoadingConditions(false);
    }
  };

  const updateReading = (
    condition: string,
    field: string,
    value: string
  ) => {
    setReadings((previous) => ({
      ...previous,

      [condition]: {
        ...(previous[condition] || {}),
        [field]: value,
      },
    }));
  };

  const getReading = (
    condition: string,
    field: string
  ) => {
    return readings[condition]?.[field] || "";
  };

  const sendToBackend = async (
    observation: any
  ) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/observations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(observation),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "FHIR storage failed:",
          data
        );

        return false;
      }

      console.log(
        "FHIR backend response:",
        data
      );

      return true;
    } catch (error) {
      console.error(
        "FHIR backend error:",
        error
      );

      return false;
    }
  };

  const saveReading = async (
    condition: string
  ) => {
    if (!patientId) {
      alert("Please login first.");
      return;
    }

    const reading =
      readings[condition] || {};

    let isValid = true;

    if (condition === "hypertension") {
      if (
        !reading.systolic ||
        !reading.diastolic ||
        !reading.heartRate
      ) {
        isValid = false;
      }
    }

    if (condition === "diabetes") {
      if (!reading.glucose) {
        isValid = false;
      }
    }

    if (condition === "copd") {
      if (
        !reading.spo2 ||
        !reading.respiratoryRate ||
        !reading.heartRate
      ) {
        isValid = false;
      }
    }

    if (!isValid) {
      alert(
        "Please enter all required readings."
      );

      return;
    }

    setSavingCondition(condition);

    try {
      /* Save locally as backup */

      const existing = JSON.parse(
        localStorage.getItem(
          "healthReadings"
        ) || "[]"
      );

      const newReading = {
        id: Date.now(),
        patientId,
        patientName,
        condition,
        readings: reading,
        date: new Date().toLocaleString(),
      };

      existing.push(newReading);

      localStorage.setItem(
        "healthReadings",
        JSON.stringify(existing)
      );


      /* Save to Neon */

      const response = await fetch(
        "http://localhost:5000/api/health-readings",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            patientId,
            condition,
            readings: reading,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Cloud save failed."
        );

        return;
      }

      console.log(
        "Cloud database response:",
        data
      );


      /* Generate FHIR */

      if (
        condition === "hypertension"
      ) {
        const observation =
          createBloodPressureObservation(
            patientId,
            Number(reading.systolic),
            Number(reading.diastolic)
          );

        await sendToBackend(
          observation
        );
      }


      if (
        condition === "diabetes"
      ) {
        const observation =
          createGlucoseObservation(
            patientId,
            Number(reading.glucose)
          );

        await sendToBackend(
          observation
        );
      }


      if (
        condition === "copd"
      ) {
        const observation =
          createCOPDObservations(
            patientId,
            Number(reading.spo2),
            Number(
              reading.respiratoryRate
            ),
            Number(
              reading.heartRate
            )
          );

        await sendToBackend(
          observation
        );
      }

      /* Clear today's form */

      setReadings((previous) => ({
        ...previous,
        [condition]: {},
      }));

      alert(
        `${getConditionName(
          condition
        )} reading saved successfully!`
      );

    } catch (error) {
      console.error(
        "Health reading save error:",
        error
      );

      alert(
        "Unable to save health reading."
      );
    } finally {
      setSavingCondition("");
    }
  };

  const getConditionName = (
    condition: string
  ) => {
    if (condition === "hypertension") {
      return "Hypertension";
    }

    if (condition === "diabetes") {
      return "Diabetes";
    }

    if (condition === "copd") {
      return "COPD";
    }

    return condition;
  };

  const getConditionDescription = (
    condition: string
  ) => {
    if (condition === "hypertension") {
      return "Monitor blood pressure and heart rate.";
    }

    if (condition === "diabetes") {
      return "Monitor blood glucose levels.";
    }

    if (condition === "copd") {
      return "Monitor oxygen saturation, respiratory rate and heart rate.";
    }

    return "";
  };

  return (
    <div className="app">

      {/* HEADER */}

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
              {patientName
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <span className="user-name">
              {patientName}
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

        <Sidebar />


        <main className="main-content">

          <div className="page-header">

            <h1>
              Daily Health Monitoring
            </h1>

            <p>
              Enter today's readings for your
              monitored health conditions.
            </p>

          </div>


          {/* PATIENT */}

          <div
            className="card"
            style={{
              marginBottom: "18px",
              background:
                "linear-gradient(135deg, #eff8ff, #ffffff)",
            }}
          >

            <strong>
              Welcome, {patientName}
            </strong>

            <p
              style={{
                marginBottom: 0,
                color: "#64748b",
              }}
            >
              Your health readings are securely
              linked to your patient account.
            </p>

          </div>


          {/* LOADING */}

          {loadingConditions && (

            <div className="card">

              <div className="empty-state">

                <h3>
                  Loading your conditions...
                </h3>

              </div>

            </div>

          )}


          {/* NO CONDITIONS */}

          {!loadingConditions &&
            conditions.length === 0 && (

              <div className="card">

                <div className="empty-state">

                  <h3>
                    No health conditions added
                  </h3>

                  <p>
                    Add a condition first to
                    start daily monitoring.
                  </p>

                  <button
                    className="primary-button"
                    style={{
                      marginTop: "14px",
                    }}
                    onClick={() =>
                      navigate(
                        "/conditions"
                      )
                    }
                  >
                    Set Up My Conditions
                  </button>

                </div>

              </div>

            )}


          {/* CONDITION CARDS */}

          {!loadingConditions &&
            conditions.length > 0 && (

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "18px",
                }}
              >

                {conditions.map(
                  (item) => {

                    const condition =
                      item.condition;

                    const currentReading =
                      readings[
                        condition
                      ] || {};

                    return (

                      <div
                        className="card"
                        key={item.id}
                      >

                        {/* CONDITION HEADER */}

                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "flex-start",
                            gap: "12px",
                            marginBottom:
                              "18px",
                          }}
                        >

                          <div>

                            <h2>
                              {getConditionName(
                                condition
                              )}
                            </h2>

                            <p
                              style={{
                                color:
                                  "#70859a",
                                margin:
                                  "4px 0 0",
                              }}
                            >
                              {getConditionDescription(
                                condition
                              )}
                            </p>

                          </div>

                          <span className="status-badge status-neutral">
                            Daily
                          </span>

                        </div>


                        {/* HYPERTENSION */}

                        {condition ===
                          "hypertension" && (

                          <div>

                            <div className="form-group">

                              <label>
                                Systolic BP
                                <span
                                  style={{
                                    color:
                                      "#94a3b8",
                                    marginLeft:
                                      "5px",
                                    fontWeight:
                                      "400",
                                  }}
                                >
                                  mmHg
                                </span>
                              </label>

                              <input
                                type="number"
                                placeholder="e.g. 120"
                                value={
                                  currentReading.systolic ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReading(
                                    condition,
                                    "systolic",
                                    e.target
                                      .value
                                  )
                                }
                              />

                            </div>


                            <div className="form-group">

                              <label>
                                Diastolic BP
                                <span
                                  style={{
                                    color:
                                      "#94a3b8",
                                    marginLeft:
                                      "5px",
                                    fontWeight:
                                      "400",
                                  }}
                                >
                                  mmHg
                                </span>
                              </label>

                              <input
                                type="number"
                                placeholder="e.g. 80"
                                value={
                                  currentReading.diastolic ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReading(
                                    condition,
                                    "diastolic",
                                    e.target
                                      .value
                                  )
                                }
                              />

                            </div>


                            <div className="form-group">

                              <label>
                                Heart Rate
                                <span
                                  style={{
                                    color:
                                      "#94a3b8",
                                    marginLeft:
                                      "5px",
                                    fontWeight:
                                      "400",
                                  }}
                                >
                                  BPM
                                </span>
                              </label>

                              <input
                                type="number"
                                placeholder="e.g. 72"
                                value={
                                  currentReading.heartRate ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReading(
                                    condition,
                                    "heartRate",
                                    e.target
                                      .value
                                  )
                                }
                              />

                            </div>

                          </div>

                        )}


                        {/* DIABETES */}

                        {condition ===
                          "diabetes" && (

                          <div>

                            <div className="form-group">

                              <label>
                                Blood Glucose
                                <span
                                  style={{
                                    color:
                                      "#94a3b8",
                                    marginLeft:
                                      "5px",
                                    fontWeight:
                                      "400",
                                  }}
                                >
                                  mg/dL
                                </span>
                              </label>

                              <input
                                type="number"
                                placeholder="e.g. 110"
                                value={
                                  currentReading.glucose ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReading(
                                    condition,
                                    "glucose",
                                    e.target
                                      .value
                                  )
                                }
                              />

                            </div>


                            <div className="form-group">

                              <label>
                                HbA1c
                                <span
                                  style={{
                                    color:
                                      "#94a3b8",
                                    marginLeft:
                                      "5px",
                                    fontWeight:
                                      "400",
                                  }}
                                >
                                  %
                                </span>
                              </label>

                              <input
                                type="number"
                                step="0.1"
                                placeholder="e.g. 6.2"
                                value={
                                  currentReading.hba1c ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReading(
                                    condition,
                                    "hba1c",
                                    e.target
                                      .value
                                  )
                                }
                              />

                            </div>


                            <div className="form-group">

                              <label>
                                Weight
                                <span
                                  style={{
                                    color:
                                      "#94a3b8",
                                    marginLeft:
                                      "5px",
                                    fontWeight:
                                      "400",
                                  }}
                                >
                                  kg
                                </span>
                              </label>

                              <input
                                type="number"
                                placeholder="e.g. 65"
                                value={
                                  currentReading.weight ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReading(
                                    condition,
                                    "weight",
                                    e.target
                                      .value
                                  )
                                }
                              />

                            </div>

                          </div>

                        )}


                        {/* COPD */}

                        {condition ===
                          "COPD" ||
                        condition ===
                          "copd" ? (

                          <div>

                            <div className="form-group">

                              <label>
                                SpO₂
                                <span
                                  style={{
                                    color:
                                      "#94a3b8",
                                    marginLeft:
                                      "5px",
                                    fontWeight:
                                      "400",
                                  }}
                                >
                                  %
                                </span>
                              </label>

                              <input
                                type="number"
                                placeholder="e.g. 97"
                                value={
                                  currentReading.spo2 ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReading(
                                    condition,
                                    "spo2",
                                    e.target
                                      .value
                                  )
                                }
                              />

                            </div>


                            <div className="form-group">

                              <label>
                                Respiratory Rate
                                <span
                                  style={{
                                    color:
                                      "#94a3b8",
                                    marginLeft:
                                      "5px",
                                    fontWeight:
                                      "400",
                                  }}
                                >
                                  breaths/min
                                </span>
                              </label>

                              <input
                                type="number"
                                placeholder="e.g. 18"
                                value={
                                  currentReading.respiratoryRate ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReading(
                                    condition,
                                    "respiratoryRate",
                                    e.target
                                      .value
                                  )
                                }
                              />

                            </div>


                            <div className="form-group">

                              <label>
                                Heart Rate
                                <span
                                  style={{
                                    color:
                                      "#94a3b8",
                                    marginLeft:
                                      "5px",
                                    fontWeight:
                                      "400",
                                  }}
                                >
                                  BPM
                                </span>
                              </label>

                              <input
                                type="number"
                                placeholder="e.g. 72"
                                value={
                                  currentReading.heartRate ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReading(
                                    condition,
                                    "heartRate",
                                    e.target
                                      .value
                                  )
                                }
                              />

                            </div>

                          </div>

                        ) : null}


                        {/* SAVE */}

                        <button
                          className="primary-button"
                          style={{
                            width: "100%",
                            marginTop: "4px",
                          }}
                          onClick={() =>
                            saveReading(
                              condition
                            )
                          }
                          disabled={
                            savingCondition ===
                            condition
                          }
                        >
                          {savingCondition ===
                          condition
                            ? "Saving..."
                            : "Save Today's Reading"}
                        </button>

                      </div>

                    );
                  }
                )}

              </div>

            )}


          {/* ADD CONDITION */}

          {!loadingConditions &&
            conditions.length > 0 && (

              <div
                style={{
                  marginTop: "20px",
                  textAlign: "center",
                }}
              >

                <button
                  className="secondary-button"
                  onClick={() =>
                    navigate(
                      "/conditions"
                    )
                  }
                >
                  + Add Another Condition
                </button>

              </div>

            )}

        </main>

      </div>

    </div>
  );
}

export default HealthMonitoring;