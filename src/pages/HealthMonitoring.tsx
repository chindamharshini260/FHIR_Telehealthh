import { useEffect, useState } from "react";

import {
  createBloodPressureObservation,
  createGlucoseObservation,
  createCOPDObservations,
  createHeartDiseaseObservations,
  createAsthmaObservations,
  createCKDObservations,
  createObesityObservations,
  createThyroidObservations,
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

  // ============================
  // FETCH PATIENT CONDITIONS
  // ============================

  const fetchConditions = async () => {
    try {
      const response = await fetch(
        `/api/patient-conditions/${patientId}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        return;
      }

      setConditions(data);
    } catch (error) {
      console.error("Condition fetch error:", error);
    } finally {
      setLoadingConditions(false);
    }
  };

  // ============================
  // UPDATE READING
  // ============================

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

  // ============================
  // GET READING
  // ============================

  const getReading = (
    condition: string,
    field: string
  ) => {
    return readings[condition]?.[field] || "";
  };

  // ============================
  // SEND FHIR TO BACKEND
  // ============================

  const sendToBackend = async (
    observation: any
  ) => {
    try {
      const response = await fetch(
        "/api/observations",
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

  // ============================
  // SAVE READING
  // ============================

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

    // ----------------------------
    // HYPERTENSION
    // ----------------------------

    if (condition === "hypertension") {
      if (
        !reading.systolic ||
        !reading.diastolic ||
        !reading.heartRate
      ) {
        isValid = false;
      }
    }

    // ----------------------------
    // DIABETES
    // ----------------------------

    if (condition === "diabetes") {
      if (!reading.glucose) {
        isValid = false;
      }
    }

    // ----------------------------
    // COPD
    // ----------------------------

    if (condition === "COPD" ||
        condition.toLowerCase() === "copd") {
      if (
        !reading.spo2 ||
        !reading.respiratoryRate ||
        !reading.heartRate
      ) {
        isValid = false;
      }
    }

    // ----------------------------
    // HEART DISEASE
    // ----------------------------

    if (condition === "heart_disease") {
      if (
        !reading.systolic ||
        !reading.diastolic ||
        !reading.heartRate ||
        !reading.spo2
      ) {
        isValid = false;
      }
    }

    // ----------------------------
    // ASTHMA
    // ----------------------------

    if (condition === "asthma") {
      if (
        !reading.spo2 ||
        !reading.respiratoryRate ||
        !reading.peakFlow
      ) {
        isValid = false;
      }
    }

    // ----------------------------
    // CKD
    // ----------------------------

    if (
      condition === "CKD" ||
      condition.toLowerCase() === "ckd"
    ) {
      if (
        !reading.creatinine ||
        !reading.egfr ||
        !reading.systolic
      ) {
        isValid = false;
      }
    }

    // ----------------------------
    // OBESITY
    // ----------------------------

    if (condition === "obesity") {
      if (
        !reading.weight ||
        !reading.height ||
        !reading.bmi
      ) {
        isValid = false;
      }
    }

    // ----------------------------
    // THYROID
    // ----------------------------

    if (condition === "thyroid") {
      if (
        !reading.tsh ||
        !reading.t3 ||
        !reading.t4
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
      // ============================
      // LOCAL STORAGE
      // ============================

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

      // ============================
      // SAVE TO NEON
      // ============================

      const response = await fetch(
        "/api/health-readings",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
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

      // ============================
      // FHIR - HYPERTENSION
      // ============================

      if (condition === "hypertension") {
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

      // ============================
      // FHIR - DIABETES
      // ============================

      if (condition === "diabetes") {
        const observation =
          createGlucoseObservation(
            patientId,

            Number(reading.glucose)
          );

        await sendToBackend(
          observation
        );
      }

      // ============================
      // FHIR - COPD
      // ============================

      if (
        condition === "COPD" ||
        condition.toLowerCase() === "copd"
      ) {
        const observation =
          createCOPDObservations(
            patientId,

            Number(reading.spo2),

            Number(
              reading.respiratoryRate
            ),

            Number(reading.heartRate)
          );

        await sendToBackend(
          observation
        );
      }

      // ============================
      // FHIR - HEART DISEASE
      // ============================

      if (condition === "heart_disease") {
        const observation =
          createHeartDiseaseObservations(
            patientId,

            Number(reading.systolic),

            Number(reading.diastolic),

            Number(reading.heartRate),

            Number(reading.spo2)
          );

        await sendToBackend(
          observation
        );
      }

      // ============================
      // FHIR - ASTHMA
      // ============================

      if (condition === "asthma") {
        const observation =
          createAsthmaObservations(
            patientId,

            Number(reading.spo2),

            Number(
              reading.respiratoryRate
            ),

            Number(reading.peakFlow)
          );

        await sendToBackend(
          observation
        );
      }

      // ============================
      // FHIR - CKD
      // ============================

      if (
        condition === "CKD" ||
        condition.toLowerCase() === "ckd"
      ) {
        const observation =
          createCKDObservations(
            patientId,

            Number(reading.creatinine),

            Number(reading.egfr),

            Number(reading.systolic)
          );

        await sendToBackend(
          observation
        );
      }

      // ============================
      // FHIR - OBESITY
      // ============================

      if (condition === "obesity") {
        const observation =
          createObesityObservations(
            patientId,

            Number(reading.weight),

            Number(reading.height),

            Number(reading.bmi)
          );

        await sendToBackend(
          observation
        );
      }

      // ============================
      // FHIR - THYROID
      // ============================

      if (condition === "thyroid") {
        const observation =
          createThyroidObservations(
            patientId,

            Number(reading.tsh),

            Number(reading.t3),

            Number(reading.t4)
          );

        await sendToBackend(
          observation
        );
      }

      // ============================
      // CLEAR FORM
      // ============================

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

  // ============================
  // CONDITION NAME
  // ============================

  const getConditionName = (
    condition: string
  ) => {
    const value =
      condition.toLowerCase();

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

  // ============================
  // CONDITION DESCRIPTION
  // ============================

  const getConditionDescription = (
    condition: string
  ) => {
    const value =
      condition.toLowerCase();

    if (value === "hypertension") {
      return "Blood pressure & heart rate";
    }

    if (value === "diabetes") {
      return "Blood glucose monitoring";
    }

    if (value === "copd") {
      return "Oxygen, breathing & heart rate";
    }

    if (value === "heart_disease") {
      return "Blood pressure, heart rate & oxygen";
    }

    if (value === "asthma") {
      return "Oxygen, breathing & peak flow";
    }

    if (value === "ckd") {
      return "Kidney function & blood pressure";
    }

    if (value === "obesity") {
      return "Weight, height & BMI";
    }

    if (value === "thyroid") {
      return "TSH, T3 & T4 monitoring";
    }

    return "";
  };

  // ============================
  // CONDITION ICON
  // ============================

  const getConditionIcon = (
    condition: string
  ) => {
    const value =
      condition.toLowerCase();

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

  // ============================
  // INPUT FIELD
  // ============================

  const inputField = (
    condition: string,
    field: string,
    label: string,
    unit: string,
    placeholder: string
  ) => (
    <div className="monitor-input-group">
      <label>
        {label}

        <span>
          {unit}
        </span>
      </label>

      <input
        type="number"
        placeholder={placeholder}
        value={getReading(
          condition,
          field
        )}
        onChange={(e) =>
          updateReading(
            condition,
            field,
            e.target.value
          )
        }
      />
    </div>
  );

  // ============================
  // UI
  // ============================

  return (
    <div className="app">

      {/* HEADER */}

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
              {patientName
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <div className="user-name">
                {patientName}
              </div>

              <small className="user-role">
                Patient
              </small>

            </div>

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

        <main className="main-content monitoring-page">

          {/* PAGE HEADER */}

          <div className="monitoring-header">

            <div>

              <div className="section-kicker">
                DAILY MONITORING
              </div>

              <h1>
                Today's Health Readings
              </h1>

              <p>
                Record your latest readings
                for your monitored conditions.
              </p>

            </div>

            <button
              className="secondary-button"
              onClick={() =>
                navigate("/conditions")
              }
            >
              + Manage Conditions
            </button>

          </div>

          {/* PATIENT STRIP */}

          <div className="monitor-patient-strip">

            <div className="monitor-patient-avatar">
              {patientName
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <strong>
                {patientName}
              </strong>

              <span>
                Your readings are securely
                linked to your patient account.
              </span>

            </div>

            <div className="monitor-date">
              {new Date().toLocaleDateString(
                undefined,
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              )}
            </div>

          </div>

          {/* LOADING */}

          {loadingConditions && (
            <div className="dashboard-panel">

              <div className="monitor-empty">
                Loading your conditions...
              </div>

            </div>
          )}

          {/* NO CONDITIONS */}

          {!loadingConditions &&
            conditions.length === 0 && (

              <div className="dashboard-panel">

                <div className="monitor-empty">

                  <div className="monitor-empty-icon">
                    +
                  </div>

                  <h3>
                    No health conditions added
                  </h3>

                  <p>
                    Add a condition first to
                    start daily monitoring.
                  </p>

                  <button
                    className="primary-button"
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

              <div className="monitoring-grid">

                {conditions.map((item) => {

                  const condition =
                    item.condition;

                  const lowerCondition =
                    condition.toLowerCase();

                  const isSaving =
                    savingCondition ===
                    condition;

                  return (

                    <div
                      className="monitor-condition-card"
                      key={item.id}
                    >

                      {/* CARD HEADER */}

                      <div className="monitor-card-header">

                        <div className="monitor-condition-title">

                          <div
                            className={`monitor-condition-icon ${lowerCondition}`}
                          >
                            {getConditionIcon(
                              condition
                            )}
                          </div>

                          <div>

                            <h2>
                              {getConditionName(
                                condition
                              )}
                            </h2>

                            <p>
                              {getConditionDescription(
                                condition
                              )}
                            </p>

                          </div>

                        </div>

                        <span className="monitor-active-badge">
                          Active
                        </span>

                      </div>

                      {/* HYPERTENSION */}

                      {lowerCondition ===
                        "hypertension" && (

                        <div className="monitor-fields">

                          {inputField(
                            condition,
                            "systolic",
                            "Systolic BP",
                            "mmHg",
                            "120"
                          )}

                          {inputField(
                            condition,
                            "diastolic",
                            "Diastolic BP",
                            "mmHg",
                            "80"
                          )}

                          {inputField(
                            condition,
                            "heartRate",
                            "Heart Rate",
                            "BPM",
                            "72"
                          )}

                        </div>

                      )}

                      {/* DIABETES */}

                      {lowerCondition ===
                        "diabetes" && (

                        <div className="monitor-fields">

                          {inputField(
                            condition,
                            "glucose",
                            "Blood Glucose",
                            "mg/dL",
                            "110"
                          )}

                          {inputField(
                            condition,
                            "hba1c",
                            "HbA1c",
                            "%",
                            "6.2"
                          )}

                          {inputField(
                            condition,
                            "weight",
                            "Weight",
                            "kg",
                            "65"
                          )}

                          {inputField(
                            condition,
                            "height",
                            "Height",
                            "cm",
                            "170"
                          )}

                          <div className="monitor-input-group">
                            <label>
                              Smoking Status
                              <span>history</span>
                            </label>
                            <select
                              value={getReading(condition, "smoking_history") || "never"}
                              onChange={(e) =>
                                updateReading(
                                  condition,
                                  "smoking_history",
                                  e.target.value
                                )
                              }
                              style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                background: "#fff",
                                fontSize: "14px",
                              }}
                            >
                              <option value="never">Never</option>
                              <option value="former">Former Smoker</option>
                              <option value="current">Current Smoker</option>
                              <option value="No Info">No Info / Prefer not to say</option>
                            </select>
                          </div>

                        </div>

                      )}

                      {/* COPD */}

                      {lowerCondition ===
                        "copd" && (

                        <div className="monitor-fields">

                          {inputField(
                            condition,
                            "spo2",
                            "SpO₂",
                            "%",
                            "97"
                          )}

                          {inputField(
                            condition,
                            "respiratoryRate",
                            "Respiratory Rate",
                            "breaths/min",
                            "18"
                          )}

                          {inputField(
                            condition,
                            "heartRate",
                            "Heart Rate",
                            "BPM",
                            "72"
                          )}

                        </div>

                      )}

                      {/* HEART DISEASE */}

                      {lowerCondition ===
                        "heart_disease" && (

                        <div className="monitor-fields">

                          {inputField(
                            condition,
                            "systolic",
                            "Systolic BP",
                            "mmHg",
                            "120"
                          )}

                          {inputField(
                            condition,
                            "diastolic",
                            "Diastolic BP",
                            "mmHg",
                            "80"
                          )}

                          {inputField(
                            condition,
                            "heartRate",
                            "Heart Rate",
                            "BPM",
                            "72"
                          )}

                          {inputField(
                            condition,
                            "spo2",
                            "SpO₂",
                            "%",
                            "97"
                          )}

                        </div>

                      )}

                      {/* ASTHMA */}

                      {lowerCondition ===
                        "asthma" && (

                        <div className="monitor-fields">

                          {inputField(
                            condition,
                            "spo2",
                            "SpO₂",
                            "%",
                            "97"
                          )}

                          {inputField(
                            condition,
                            "respiratoryRate",
                            "Respiratory Rate",
                            "breaths/min",
                            "18"
                          )}

                          {inputField(
                            condition,
                            "peakFlow",
                            "Peak Flow",
                            "L/min",
                            "400"
                          )}

                        </div>

                      )}

                      {/* CKD */}

                      {lowerCondition ===
                        "ckd" && (

                        <div className="monitor-fields">

                          {inputField(
                            condition,
                            "creatinine",
                            "Creatinine",
                            "mg/dL",
                            "1.0"
                          )}

                          {inputField(
                            condition,
                            "egfr",
                            "eGFR",
                            "mL/min",
                            "90"
                          )}

                          {inputField(
                            condition,
                            "systolic",
                            "Systolic BP",
                            "mmHg",
                            "120"
                          )}

                        </div>

                      )}

                      {/* OBESITY */}

                      {lowerCondition ===
                        "obesity" && (

                        <div className="monitor-fields">

                          {inputField(
                            condition,
                            "weight",
                            "Weight",
                            "kg",
                            "65"
                          )}

                          {inputField(
                            condition,
                            "height",
                            "Height",
                            "cm",
                            "170"
                          )}

                          {inputField(
                            condition,
                            "bmi",
                            "BMI",
                            "kg/m²",
                            "22"
                          )}

                        </div>

                      )}

                      {/* THYROID */}

                      {lowerCondition ===
                        "thyroid" && (

                        <div className="monitor-fields">

                          {inputField(
                            condition,
                            "tsh",
                            "TSH",
                            "mIU/L",
                            "2.5"
                          )}

                          {inputField(
                            condition,
                            "t3",
                            "T3",
                            "ng/dL",
                            "120"
                          )}

                          {inputField(
                            condition,
                            "t4",
                            "T4",
                            "µg/dL",
                            "8"
                          )}

                        </div>

                      )}

                      {/* SAVE */}

                      <button
                        className="monitor-save-button"
                        onClick={() =>
                          saveReading(
                            condition
                          )
                        }
                        disabled={isSaving}
                      >
                        {isSaving
                          ? "Saving..."
                          : "Save Today's Reading"}
                      </button>

                    </div>

                  );
                })}

              </div>

            )}

          {/* BOTTOM INFO */}

          {!loadingConditions &&
            conditions.length > 0 && (

              <div className="monitor-bottom-row">

                <div className="monitor-info-card">

                  <div className="monitor-info-icon">
                    ✓
                  </div>

                  <div>

                    <strong>
                      Secure Health Monitoring
                    </strong>

                    <p>
                      Your readings are linked
                      to your patient account
                      and can be represented
                      using FHIR healthcare
                      resources.
                    </p>

                  </div>

                </div>

                <button
                  className="secondary-button"
                  onClick={() =>
                    navigate("/history")
                  }
                >
                  View Health History →
                </button>

              </div>

            )}

        </main>

      </div>

    </div>
  );
}

export default HealthMonitoring;