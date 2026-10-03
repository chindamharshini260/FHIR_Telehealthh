import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type HealthRecord = {
  id: string;
  patient_id: string;
  patient_name: string;
  condition: string;
  readings: Record<string, string | number>;
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

  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
  );

  useEffect(() => {
    if (!loggedInUser) {
      navigate("/");
      return;
    }

    if (loggedInUser.role !== "doctor") {
      navigate("/dashboard");
      return;
    }

    fetchHealthRecords();
  }, [navigate, loggedInUser?.id]);

  const fetchHealthRecords = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/doctor/health-readings"
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        return;
      }

      setRecords(data);
    } catch (error) {
      console.error("Doctor dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFHIRRecords = async () => {
    setFhirLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/fhir-observations"
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        alert(data.message || "Failed to fetch FHIR records.");
        return;
      }

      setFhirRecords(data);
    } catch (error) {
      console.error("FHIR fetch error:", error);
      alert("Unable to fetch FHIR records.");
    } finally {
      setFhirLoading(false);
    }
  };

  const getRiskLevel = (record: HealthRecord) => {
    const readings = record.readings || {};

    if (record.condition === "hypertension") {
      const systolic = Number(readings.systolic);
      const diastolic = Number(readings.diastolic);

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

    if (record.condition === "diabetes") {
      const glucose = Number(readings.glucose);

      if (glucose >= 200) {
        return "High";
      }

      if (glucose >= 140) {
        return "Moderate";
      }

      return "Low";
    }

    if (record.condition === "COPD") {
      const spo2 = Number(readings.spo2);
      const respiratoryRate = Number(
        readings.respiratoryRate
      );

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

    return "Low";
  };

  const getRiskClass = (risk: string) => {
    if (risk === "High") {
      return "status-badge status-high";
    }

    if (risk === "Moderate") {
      return "status-badge status-moderate";
    }

    return "status-badge status-low";
  };

  const totalRecords = records.length;

  const uniquePatients = new Set(
    records.map((record) => record.patient_id)
  ).size;

  const uniqueConditions = new Set(
    records.map((record) => record.condition)
  ).size;

  const highRiskRecords = records.filter(
    (record) => getRiskLevel(record) === "High"
  ).length;

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
              D
            </div>

            <span className="user-name">
              Doctor Portal
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

        {/* SIDEBAR */}

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
              navigate("/doctor/appointments")
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


        {/* MAIN CONTENT */}

        <main className="main-content">

          <div className="page-header">

            <div>

              <h1>
                Doctor Dashboard
              </h1>

              <p>
                Monitor patient health records
                and FHIR-enabled observations.
              </p>

            </div>

          </div>


          {/* STATISTICS */}

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
                Registered patients
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


          {/* FHIR SECTION */}

          <div
            className="card"
            style={{
              marginTop: "24px",
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "15px",
              }}
            >

              <div>

                <h2>
                  FHIR Interoperability
                </h2>

                <p
                  style={{
                    color: "#64748b",
                    fontSize: "14px",
                    marginTop: "6px",
                  }}
                >
                  FHIR resources generated from
                  patient health observations.
                </p>

              </div>

              <button
                className="primary-button"
                onClick={fetchFHIRRecords}
                disabled={fhirLoading}
              >
                {fhirLoading
                  ? "Loading..."
                  : "View FHIR Records"}
              </button>

            </div>


            {fhirRecords.length > 0 && (

              <div
                style={{
                  marginTop: "20px",
                }}
              >

                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                  }}
                >

                 {fhirRecords.map(
  (record) => (

    <div
      key={record.id}
      style={{
        padding: "16px",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        background: "#f8fafc",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >

        <div>

          <strong
            style={{
              fontSize: "17px",
              color: "#0f172a",
            }}
          >
            FHIR Observation
          </strong>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              marginTop: "14px",
            }}
          >

            <div>

              <span
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                Resource Type
              </span>

              <div
                style={{
                  fontWeight: "600",
                  marginTop: "3px",
                }}
              >
                {record.resource_type}
              </div>

            </div>


            <div>

              <span
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                Patient
              </span>

              <div
                style={{
                  fontWeight: "600",
                  marginTop: "3px",
                  wordBreak: "break-all",
                }}
              >
                {record.patient_id}
              </div>

            </div>


            <div>

              <span
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                Status
              </span>

              <div
                style={{
                  fontWeight: "600",
                  marginTop: "3px",
                }}
              >
                Final
              </div>

            </div>


            <div>

              <span
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                Created
              </span>

              <div
                style={{
                  fontWeight: "600",
                  marginTop: "3px",
                }}
              >
                {new Date(
                  record.created_at
                ).toLocaleString()}
              </div>

            </div>

          </div>

        </div>


        <span className="status-badge status-low">
          FHIR
        </span>

      </div>


      <details
        style={{
          marginTop: "18px",
        }}
      >

        <summary
          style={{
            cursor: "pointer",
            color: "#2563eb",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          View Full FHIR JSON
        </summary>

        <pre
          style={{
            marginTop: "12px",
            padding: "15px",
            background: "#0f172a",
            color: "#e2e8f0",
            borderRadius: "10px",
            overflowX: "auto",
            fontSize: "12px",
            lineHeight: "1.5",
          }}
        >
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

              </div>

            )}

            {!fhirLoading &&
              fhirRecords.length === 0 && (

                <div
                  className="empty-state"
                  style={{
                    marginTop: "20px",
                  }}
                >

                  <h3>
                    No FHIR records loaded
                  </h3>

                  <p>
                    Click "View FHIR Records" to
                    retrieve stored FHIR resources.
                  </p>

                </div>

              )}

          </div>


          {/* PATIENT RECORDS */}

          <div
            className="card"
            style={{
              marginTop: "24px",
            }}
          >

            <div className="page-header">

              <div>

                <h2>
                  Patient Health Records
                </h2>

                <p>
                  Review recent patient
                  observations and risk levels.
                </p>

              </div>

            </div>


            {loading ? (

              <div className="empty-state">

                <h3>
                  Loading records...
                </h3>

              </div>

            ) : records.length === 0 ? (

              <div className="empty-state">

                <h3>
                  No health records
                </h3>

                <p>
                  Patient health readings will
                  appear here.
                </p>

              </div>

            ) : (

              <div
                style={{
                  display: "grid",
                  gap: "16px",
                }}
              >

                {records.map(
                  (record) => {

                    const risk =
                      getRiskLevel(record);

                    return (

                      <div
                        key={record.id}
                        className="card"
                        style={{
                          background:
                            "#f8fafc",
                        }}
                      >

                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            flexWrap:
                              "wrap",
                            gap: "12px",
                          }}
                        >

                          <div>

                            <h2>
                              {record.patient_name}
                            </h2>

                            <p
                              style={{
                                color:
                                  "#64748b",
                                fontSize:
                                  "13px",
                              }}
                            >
                              Patient ID:{" "}
                              {record.patient_id}
                            </p>

                          </div>

                          <span
                            className={getRiskClass(
                              risk
                            )}
                          >
                            {risk} Risk
                          </span>

                        </div>


                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            marginTop: "15px",
                            marginBottom:
                              "15px",
                            flexWrap:
                              "wrap",
                            gap: "10px",
                          }}
                        >

                          <strong
                            style={{
                              textTransform:
                                "capitalize",
                            }}
                          >
                            {record.condition}
                          </strong>

                          <span
                            style={{
                              color:
                                "#64748b",
                              fontSize:
                                "13px",
                            }}
                          >
                            {new Date(
                              record.recorded_at
                            ).toLocaleString()}
                          </span>

                        </div>


                        <div className="reading-grid">

                          {Object.entries(
                            record.readings || {}
                          ).map(
                            ([key, value]) => (

                              <div
                                className="reading-item"
                                key={key}
                              >

                                <div className="reading-label">
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
                                </div>

                                <div className="reading-value">

                                  {String(value)}

                                </div>

                              </div>

                            )
                          )}

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            )}

          </div>

        </main>

      </div>

    </div>
  );
}

export default DoctorDashboard;