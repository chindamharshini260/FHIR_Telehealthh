import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type HealthRecord = {
  id: string;
  patient_id: string;
  patient_name: string;
  condition: string;
  readings: Record<string, string | number>;
  ml_profile?: Record<string, string | number> | null;
  recorded_at: string;
};

type FHIRRecord = {
  id: string;
  patient_id: string;
  resource_type: string;
  fhir_resource: any;
  created_at: string;
};

function DoctorDashboard() {
  const navigate = useNavigate();

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [fhirRecords, setFhirRecords] = useState<FHIRRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [fhirLoading, setFhirLoading] = useState(false);
  const [mlResult, setMlResult] = useState<{
  disease: string;
  prediction: number;
  probability: number;
  risk: string;
} | null>(null);

const [mlLoading, setMlLoading] = useState(false);
const [mlResultRecordId, setMlResultRecordId] =
  useState<string | null>(null);

  const [hypertensionMlResult, setHypertensionMlResult] = useState<{
  disease: string;
  prediction: number;
  probability: number;
  risk: string;
} | null>(null);

const [hypertensionMlLoading, setHypertensionMlLoading] =
  useState(false);

const [hypertensionMlResultRecordId, setHypertensionMlResultRecordId] =
  useState<string | null>(null);

const [diabetesMlResult, setDiabetesMlResult] = useState<{
  disease: string;
  prediction: number;
  probability: number;
  risk: string;
  message?: string;
  disclaimer?: string;
} | null>(null);

const [diabetesMlLoading, setDiabetesMlLoading] = useState(false);
const [diabetesMlResultRecordId, setDiabetesMlResultRecordId] =
  useState<string | null>(null);

  const [selectedPatient, setSelectedPatient] =
    useState("all");

  const [selectedCondition, setSelectedCondition] =
    useState("all");

  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
  );

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  useEffect(() => {
    if (!loggedInUser) {
      navigate("/");
      return;
    }

    const userRole = (loggedInUser.role || "").toLowerCase().trim();
    if (userRole === "patient") {
      navigate("/dashboard");
      return;
    }
    if (userRole === "admin") {
      navigate("/admin");
      return;
    }
    if (userRole !== "doctor") {
      navigate("/");
      return;
    }

    fetchHealthRecords();
  }, [navigate, loggedInUser?.id]);

  // =========================================================
  // FETCH HEALTH RECORDS
  // =========================================================

  const fetchHealthRecords = async () => {
    try {
      const response = await fetch(
        "/api/doctor/health-readings"
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        return;
      }

      setRecords(data);
    } catch (error) {
      console.error(
        "Doctor dashboard error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH FHIR RECORDS
  // =========================================================

  const fetchFHIRRecords = async () => {
    setFhirLoading(true);

    try {
      const response = await fetch(
        "/api/fhir-observations"
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);

        alert(
          data.message ||
            "Failed to fetch FHIR records."
        );

        return;
      }

      setFhirRecords(data);
    } catch (error) {
      console.error(
        "FHIR fetch error:",
        error
      );

      alert(
        "Unable to fetch FHIR records."
      );
    } finally {
      setFhirLoading(false);
    }
  };

  // =========================================================
  // RISK LEVEL
  // =========================================================

  const getRiskLevel = (
    record: HealthRecord
  ) => {
    const readings =
      record.readings || {};

    const condition =
      record.condition.toLowerCase();

      // =========================================================
// ML HEART DISEASE PREDICTION
// =========================================================


    // -------------------------
    // HYPERTENSION
    // -------------------------

    if (condition === "hypertension") {
      const systolic =
        Number(readings.systolic);

      const diastolic =
        Number(readings.diastolic);

      if (
        systolic >= 140 ||
        diastolic >= 90
      ) {
        return "High";
      }

      if (
        systolic >= 130 ||
        diastolic >= 80
      ) {
        return "Moderate";
      }

      return "Low";
    }

    // -------------------------
    // DIABETES
    // -------------------------

    if (condition === "diabetes") {
      const glucose =
        Number(readings.glucose);

      if (glucose >= 200) {
        return "High";
      }

      if (glucose >= 140) {
        return "Moderate";
      }

      return "Low";
    }

    // -------------------------
    // COPD
    // -------------------------

    if (condition === "copd") {
      const spo2 =
        Number(readings.spo2);

      const respiratoryRate =
        Number(readings.respiratoryRate);

      if (
        spo2 < 92 ||
        respiratoryRate > 24
      ) {
        return "High";
      }

      if (
        spo2 < 95 ||
        respiratoryRate > 20
      ) {
        return "Moderate";
      }

      return "Low";
    }

    // -------------------------
    // HEART DISEASE
    // -------------------------

    if (
      condition === "heart_disease"
    ) {
      const systolic =
        Number(readings.systolic);

      const diastolic =
        Number(readings.diastolic);

      const spo2 =
        Number(readings.spo2);

      if (
        systolic >= 140 ||
        diastolic >= 90 ||
        spo2 < 92
      ) {
        return "High";
      }

      if (
        systolic >= 130 ||
        diastolic >= 80 ||
        spo2 < 95
      ) {
        return "Moderate";
      }

      return "Low";
    }

    // -------------------------
    // ASTHMA
    // -------------------------

    if (condition === "asthma") {
      const spo2 =
        Number(readings.spo2);

      const respiratoryRate =
        Number(readings.respiratoryRate);

      const peakFlow =
        Number(readings.peakFlow);

      if (
        spo2 < 92 ||
        respiratoryRate > 24 ||
        peakFlow < 250
      ) {
        return "High";
      }

      if (
        spo2 < 95 ||
        respiratoryRate > 20 ||
        peakFlow < 350
      ) {
        return "Moderate";
      }

      return "Low";
    }

    // -------------------------
    // CKD
    // -------------------------

    if (condition === "ckd") {
      const creatinine =
        Number(readings.creatinine);

      const egfr =
        Number(readings.egfr);

      const systolic =
        Number(readings.systolic);

      if (
        creatinine >= 3 ||
        egfr < 30 ||
        systolic >= 160
      ) {
        return "High";
      }

      if (
        creatinine >= 1.5 ||
        egfr < 60 ||
        systolic >= 140
      ) {
        return "Moderate";
      }

      return "Low";
    }

    // -------------------------
    // OBESITY
    // -------------------------

    if (condition === "obesity") {
      const bmi =
        Number(readings.bmi);

      if (bmi >= 40) {
        return "High";
      }

      if (bmi >= 30) {
        return "Moderate";
      }

      return "Low";
    }

    // -------------------------
    // THYROID
    // -------------------------

    if (condition === "thyroid") {
      const tsh =
        Number(readings.tsh);

      if (
        tsh < 0.1 ||
        tsh > 10
      ) {
        return "High";
      }

      if (
        tsh < 0.4 ||
        tsh > 4.5
      ) {
        return "Moderate";
      }

      return "Low";
    }

    return "Low";
  };

 const predictHeartDisease = async (
  record: HealthRecord
) => {
  try {
    console.log("ML BUTTON CLICKED", record);

    setMlLoading(true);
    setMlResult(null);

    const readings = record.readings || {};

    const mlInput = {
      age: Number(readings.age || 55),
      sex: Number(readings.sex || 1),
      cp: Number(readings.cp || 1),
      trestbps: Number(readings.systolic || 120),
      chol: Number(readings.chol || 200),
      fbs: Number(readings.fbs || 0),
      restecg: Number(readings.restecg || 0),
      thalach: Number(
        readings.thalach ||
        readings.heartRate ||
        70
      ),
      exang: Number(readings.exang || 0),
      oldpeak: Number(readings.oldpeak || 0),
      slope: Number(readings.slope || 1),
      ca: Number(readings.ca || 0),
      thal: Number(readings.thal || 3),
    };

    console.log("Sending ML request");

    const response = await fetch(
      "/api/ml/heart-disease",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mlInput),
      }
    );

    console.log(
      "ML response status:",
      response.status
    );

    const data = await response.json();

    console.log(
      "ML response data:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
        "ML prediction failed"
      );
    }

    setMlResult(data.prediction);

    setMlResultRecordId(record.id);

    console.log(
      "SETTING ML RESULT:",
      data.prediction
    );

  } catch (error) {
    console.error(
      "ML prediction error:",
      error
    );

    alert(
      "Unable to get ML prediction."
    );

  } finally {
    setMlLoading(false);
  }
};
const predictHypertension = async (
  record: HealthRecord
) => {
  try {
    console.log(
      "HYPERTENSION ML BUTTON CLICKED",
      record
    );

    setHypertensionMlLoading(true);
    setHypertensionMlResult(null);

    const readings = record.readings || {};

    const profile = record.ml_profile || {};
    console.log("Hypertension ML profile:", profile);
console.log("Hypertension readings:", readings);

const mlInput = {
  male: Number(profile.male),
  age: Number(profile.age),
  currentSmoker: Number(profile.currentSmoker),
  cigsPerDay: Number(profile.cigsPerDay),
  BPMeds: Number(profile.BPMeds),
  diabetes: Number(profile.diabetes),
  totChol: Number(profile.totChol),
  sysBP: Number(readings.systolic),
  diaBP: Number(readings.diastolic),
  BMI: Number(profile.BMI),
  heartRate: Number(readings.heartRate),
  glucose: Number(profile.glucose),
};

    console.log(
      "Sending hypertension ML request:",
      mlInput
    );

    const response = await fetch(
      "/api/ml/hypertension",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mlInput),
      }
    );

    const data = await response.json();

    console.log(
      "Hypertension ML response:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
        "Hypertension ML prediction failed"
      );
    }

    setHypertensionMlResult(
      data.prediction
    );

    setHypertensionMlResultRecordId(
      record.id
    );

  } catch (error) {
    console.error(
      "Hypertension ML prediction error:",
      error
    );

    alert(
      "Unable to get hypertension ML prediction."
    );

  } finally {
    setHypertensionMlLoading(false);
  }
};

const predictDiabetes = async (record: HealthRecord) => {
  try {
    setDiabetesMlLoading(true);
    setDiabetesMlResult(null);

    const readings = record.readings || {};
    const profile = record.ml_profile || {};

    const heightM = (Number(readings.height) || 170) / 100;
    const weightKg = Number(readings.weight) || 70;
    const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

    const mlInput = {
      gender: profile.male === 1 ? "Male" : "Female",
      age: Number(profile.age || 45),
      hypertension: profile.BPMeds === 1 || Number(readings.systolic || 120) >= 140 ? 1 : 0,
      heart_disease: 0,
      smoking_history: readings.smoking_history || (profile.currentSmoker === 1 ? "current" : "never"),
      bmi: bmi,
      HbA1c_level: Number(readings.hba1c || 5.8),
      blood_glucose_level: Number(readings.glucose || 110),
    };

    const response = await fetch("/api/ml/diabetes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mlInput),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Diabetes ML prediction failed");
    }

    setDiabetesMlResult(data.prediction);
    setDiabetesMlResultRecordId(record.id);

  } catch (error) {
    console.error("Diabetes ML prediction error:", error);
    alert("Unable to get diabetes ML prediction.");
  } finally {
    setDiabetesMlLoading(false);
  }
};
  // =========================================================
  // RISK CSS CLASS
  // =========================================================

  const getRiskClass = (
    risk: string
  ) => {
    if (risk === "High") {
      return "status-badge status-high";
    }

    if (risk === "Moderate") {
      return "status-badge status-moderate";
    }

    return "status-badge status-low";
  };

  // =========================================================
  // CONDITION NAME
  // =========================================================

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

  // =========================================================
  // PATIENTS
  // =========================================================

  const patients = useMemo(() => {
    const map = new Map<
      string,
      string
    >();

    records.forEach((record) => {
      map.set(
        record.patient_id,
        record.patient_name
      );
    });

    return Array.from(
      map.entries()
    ).map(([id, name]) => ({
      id,
      name,
    }));
  }, [records]);

  // =========================================================
  // CONDITIONS
  // =========================================================

  const conditions = useMemo(() => {
    return Array.from(
      new Set(
        records.map(
          (record) =>
            record.condition
        )
      )
    );
  }, [records]);

  // =========================================================
  // FILTERED RECORDS
  // =========================================================

  const filteredRecords =
    useMemo(() => {
      return records.filter(
        (record) => {
          const patientMatch =
            selectedPatient ===
              "all" ||
            record.patient_id ===
              selectedPatient;

          const conditionMatch =
            selectedCondition ===
              "all" ||
            record.condition ===
              selectedCondition;

          return (
            patientMatch &&
            conditionMatch
          );
        }
      );
    }, [
      records,
      selectedPatient,
      selectedCondition,
    ]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalRecords =
    records.length;

  const uniquePatients =
    patients.length;

  const uniqueConditions =
    conditions.length;

  const highRiskRecords =
    records.filter(
      (record) =>
        getRiskLevel(record) ===
        "High"
    ).length;

  // =========================================================
  // LATEST RECORDS
  // =========================================================

  const latestRecords =
    filteredRecords.slice(0, 8);

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem(
      "loggedInUser"
    );

    navigate("/");
  };

  return (
    <div className="app">

      {/* =====================================================
          HEADER
          ===================================================== */}

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
                .toUpperCase() ||
                "D"}
            </div>

            <div>

              <div className="user-name">
                {loggedInUser?.name ||
                  "Doctor"}
              </div>

              <small className="user-role">
                Doctor
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

      {/* =====================================================
          DASHBOARD LAYOUT
          ===================================================== */}

      <div className="dashboard-layout">

        {/* ===================================================
            SIDEBAR
            =================================================== */}

        <aside className="sidebar">

          <div className="sidebar-title">
            Doctor Portal
          </div>

          <button
            className="nav-item active"
            onClick={() =>
              navigate("/doctor")
            }
          >
            <span className="nav-icon">
              ▣
            </span>

            <span>
              Patient Overview
            </span>

          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/doctor/appointments"
              )
            }
          >
            <span className="nav-icon">
              ◷
            </span>

            <span>
              Appointments
            </span>

          </button>

        </aside>

        {/* ===================================================
            MAIN CONTENT
            =================================================== */}

        <main className="main-content doctor-page">

          {/* PAGE HEADER */}

          <div className="doctor-page-header">

            <div>

              <div className="section-kicker">
                CLINICAL OVERVIEW
              </div>

              <h1>
                Doctor Dashboard
              </h1>

              <p>
                Monitor patient health records
                and FHIR-enabled observations.
              </p>

            </div>

            <button
              className="primary-button"
              onClick={() =>
                navigate(
                  "/doctor/appointments"
                )
              }
            >
              View Appointments
            </button>

          </div>

          {/* =================================================
              STATISTICS
              ================================================= */}

          <div className="stats-grid">

            <div className="stat-card">

              <div className="stat-label">
                Total Records
              </div>

              <div className="stat-value">
                {totalRecords}
              </div>

              <div className="stat-unit">
                Health readings
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-label">
                Patients
              </div>

              <div className="stat-value">
                {uniquePatients}
              </div>

              <div className="stat-unit">
                Patients with readings
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-label">
                Conditions
              </div>

              <div className="stat-value">
                {uniqueConditions}
              </div>

              <div className="stat-unit">
                Conditions monitored
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-label">
                High Risk
              </div>

              <div className="stat-value">
                {highRiskRecords}
              </div>

              <div className="stat-unit">
                Records requiring attention
              </div>

            </div>

          </div>

          {/* =================================================
              FILTERS
              ================================================= */}

          <div className="doctor-filter-card">

            <div>

              <span className="doctor-filter-label">
                PATIENT
              </span>

              <select
                value={selectedPatient}
                onChange={(e) =>
                  setSelectedPatient(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All Patients
                </option>

                {patients.map(
                  (patient) => (
                    <option
                      key={patient.id}
                      value={patient.id}
                    >
                      {patient.name}
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <span className="doctor-filter-label">
                CONDITION
              </span>

              <select
                value={selectedCondition}
                onChange={(e) =>
                  setSelectedCondition(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All Conditions
                </option>

                {conditions.map(
                  (condition) => (
                    <option
                      key={condition}
                      value={condition}
                    >
                      {getConditionName(
                        condition
                      )}
                    </option>
                  )
                )}

              </select>

            </div>

            <button
              className="secondary-button"
              onClick={() => {
                setSelectedPatient(
                  "all"
                );

                setSelectedCondition(
                  "all"
                );
              }}
            >
              Clear Filters
            </button>

          </div>

          {/* =================================================
              PATIENT HEALTH RECORDS
              ================================================= */}

          <div className="doctor-section-card">

            <div className="doctor-section-header">

              <div>

                <h2>
                  Patient Health Records
                </h2>

                <p>
                  Review recent patient
                  measurements and risk levels.
                </p>

              </div>

              <span className="doctor-record-count">
                {filteredRecords.length} records
              </span>

            </div>

            {loading ? (

              <div className="doctor-empty">
                Loading patient records...
              </div>

            ) : filteredRecords.length ===
              0 ? (

              <div className="doctor-empty">

                <div className="doctor-empty-icon">
                  ◷
                </div>

                <h3>
                  No records found
                </h3>

                <p>
                  No health records match
                  the selected filters.
                </p>

              </div>

            ) : (

              <div className="doctor-record-list">

                {latestRecords.map(
                  (record) => {

                    const risk =
                      getRiskLevel(
                        record
                      );

                    return (

                      <div
                        className="doctor-record-card"
                        key={record.id}
                      >

                        <div className="doctor-record-top">

                          <div>

                            <h3>
                              {
                                record.patient_name
                              }
                            </h3>

                            <span>
                              Patient ID:{" "}
                              {
                                record.patient_id
                              }
                            </span>

                          </div>

                          <span
                            className={getRiskClass(
                              risk
                            )}
                          >
                            {risk} Risk
                          </span>

                        </div>

                        <div className="doctor-record-meta">

                          <strong>
                            {getConditionName(
                              record.condition
                            )}
                          </strong>

                          <span>
                            {new Date(
                              record.recorded_at
                            ).toLocaleString()}
                          </span>

                        </div>

                        <div className="doctor-reading-grid">

                          {Object.entries(
                            record.readings ||
                              {}
                          ).map(
                            ([key, value]) => (

                              <div
                                className="doctor-reading"
                                key={key}
                              >

                                <span>
                                  {key
                                    .replace(
                                      /([A-Z])/g,
                                      " $1"
                                    )
                                    .replace(
                                      /^./,
                                      (letter) =>
                                        letter.toUpperCase()
                                    )}
                                </span>

                                <strong>
                                  {String(
                                    value
                                  )}
                                </strong>

                              </div>

                            )
                          )}

                        </div>

                       \<div className="ml-action-row">

  {/* HEART DISEASE ML */}
  {record.condition.toLowerCase() === "heart_disease" && (
    <>
      <button
        className="primary-button"
        onClick={() =>
          predictHeartDisease(record)
        }
        disabled={mlLoading}
      >
        {mlLoading
          ? "Analyzing..."
          : "🤖 Analyze Heart Disease"}
      </button>

      {mlResult &&
        mlResultRecordId === record.id && (
          <div className="ml-inline-result">

            <div className="ml-result-title">
              🤖 Heart Disease ML Assessment
            </div>

            <div className="ml-result-items">

              <div>
                <span>Risk</span>
                <strong>
                  {mlResult.risk}
                </strong>
              </div>

              <div>
                <span>Probability</span>
                <strong>
                  {mlResult.probability}%
                </strong>
              </div>

              <div>
                <span>Prediction</span>
                <strong>
                  {mlResult.prediction === 1
                    ? "Heart Disease"
                    : "No Heart Disease"}
                </strong>
              </div>

            </div>

            <div className="ml-disclaimer">
              Decision support only — not a medical diagnosis.
            </div>

          </div>
        )}
    </>
  )}

  {/* HYPERTENSION ML */}
  {record.condition.toLowerCase() === "hypertension" && (
    <>
      <button
        className="primary-button"
        onClick={() =>
          predictHypertension(record)
        }
        disabled={hypertensionMlLoading}
      >
        {hypertensionMlLoading
          ? "Analyzing..."
          : "🤖 Analyze Hypertension"}
      </button>

      {hypertensionMlResult &&
        hypertensionMlResultRecordId === record.id && (
          <div className="ml-inline-result">

            <div className="ml-result-title">
              🤖 Hypertension ML Assessment
            </div>

            <div className="ml-result-items">

              <div>
                <span>Risk</span>
                <strong>
                  {hypertensionMlResult.risk}
                </strong>
              </div>

              <div>
                <span>Probability</span>
                <strong>
                  {hypertensionMlResult.probability}%
                </strong>
              </div>

              <div>
                <span>Prediction</span>
                <strong>
                  {hypertensionMlResult.prediction === 1
                    ? "Hypertension Risk"
                    : "No Hypertension Risk"}
                </strong>
              </div>

            </div>

            <div className="ml-disclaimer">
              Decision support only — not a medical diagnosis.
            </div>

          </div>
        )}
    </>
  )}

  {/* DIABETES ML */}
  {record.condition.toLowerCase() === "diabetes" && (
    <>
      <button
        className="primary-button"
        onClick={() => predictDiabetes(record)}
        disabled={diabetesMlLoading}
      >
        {diabetesMlLoading ? "Analyzing..." : "🤖 Analyze Diabetes"}
      </button>

      {diabetesMlResult && diabetesMlResultRecordId === record.id && (
        <div className="ml-inline-result">
          <div className="ml-result-title">
            🤖 Diabetes ML Risk Assessment
          </div>

          <div className="ml-result-items">
            <div>
              <span>Risk</span>
              <strong className={getRiskClass(diabetesMlResult.risk)}>
                {diabetesMlResult.risk}
              </strong>
            </div>

            <div>
              <span>Probability</span>
              <strong>{diabetesMlResult.probability}%</strong>
            </div>

            <div>
              <span>Prediction</span>
              <strong>
                {diabetesMlResult.prediction === 1
                  ? "Elevated Diabetes Risk"
                  : "Low Diabetes Risk"}
              </strong>
            </div>
          </div>

          {diabetesMlResult.message && (
            <p style={{ fontSize: "13px", color: "#334155", margin: "8px 0" }}>
              {diabetesMlResult.message}
            </p>
          )}

          <div className="ml-disclaimer">
            {diabetesMlResult.disclaimer ||
              "AI-generated risk assessment for clinical decision support only. Final clinical decisions must be made by a qualified healthcare professional."}
          </div>
        </div>
      )}
    </>
  )}

</div>

                      </div>

                    );
                  }
                )}

              </div>

            )}

          </div>

          {/* =================================================
              FHIR INTEROPERABILITY
              ================================================= */}

          <div className="doctor-section-card">

            <div className="doctor-section-header">

              <div>

                <h2>
                  FHIR Interoperability
                </h2>

                <p>
                  FHIR resources generated from
                  patient health observations.
                </p>

              </div>

              <button
                className="primary-button"
                onClick={
                  fetchFHIRRecords
                }
                disabled={
                  fhirLoading
                }
              >
                {fhirLoading
                  ? "Loading..."
                  : "Load FHIR Records"}
              </button>

            </div>

            {fhirRecords.length >
              0 && (

              <div className="fhir-record-list">

                {fhirRecords.map(
                  (record) => (

                    <div
                      className="fhir-record-card"
                      key={record.id}
                    >

                      <div className="fhir-record-header">

                        <div>

                          <h3>
                            FHIR Resource
                          </h3>

                          <span>
                            Patient:{" "}
                            {
                              record.patient_id
                            }
                          </span>

                        </div>

                        <span className="status-badge status-low">
                          FHIR
                        </span>

                      </div>

                      <div className="fhir-meta-grid">

                        <div>

                          <span>
                            Resource Type
                          </span>

                          <strong>
                            {
                              record.resource_type
                            }
                          </strong>

                        </div>

                        <div>

                          <span>
                            Status
                          </span>

                          <strong>
                            Final
                          </strong>

                        </div>

                        <div>

                          <span>
                            Created
                          </span>

                          <strong>
                            {new Date(
                              record.created_at
                            ).toLocaleString()}
                          </strong>

                        </div>

                      </div>

                      <details className="fhir-details">

                        <summary>
                          View Full FHIR JSON
                        </summary>

                        <pre>
                          {JSON.stringify(
                            record.fhir_resource,
                            null,
                            2
                          )}
                        </pre>

                      </details>

                    </div>

                  )
                )}

              </div>

            )}

            {!fhirLoading &&
              fhirRecords.length ===
                0 && (

                <div className="doctor-empty">

                  <div className="doctor-empty-icon">
                    🧬
                  </div>

                  <h3>
                    FHIR records not loaded
                  </h3>

                  <p>
                    Click "Load FHIR Records"
                    to retrieve stored FHIR
                    resources.
                  </p>

                </div>

              )}

          </div>

        </main>

      </div>

    </div>
  );
}

export default DoctorDashboard;