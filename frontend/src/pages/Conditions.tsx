import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createConditionResource } from "../services/fhirService";
type Condition = {
  id: string;
  condition: string;
  created_at: string;
};

const availableConditions = [
  {
    value: "hypertension",
    name: "Hypertension",
    description:
      "Monitor blood pressure and heart rate.",
  },
  {
    value: "diabetes",
    name: "Diabetes",
    description:
      "Monitor blood glucose levels.",
  },
  {
    value: "COPD",
    name: "COPD",
    description:
      "Monitor oxygen saturation, respiratory rate and heart rate.",
  },
];

function Conditions() {
  const navigate = useNavigate();

  const [conditions, setConditions] =
    useState<Condition[]>([]);

  const [selectedCondition, setSelectedCondition] =
    useState("");

  const [loading, setLoading] = useState(true);

  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
  );

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
        `http://localhost:5000/api/patient-conditions/${loggedInUser.id}`
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
      setLoading(false);
    }
  };

  const addCondition = async () => {
  if (!selectedCondition) {
    alert("Please select a condition.");
    return;
  }

  try {
    // 1. Save condition in PostgreSQL
    const response = await fetch(
      "http://localhost:5000/api/patient-conditions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: loggedInUser.id,
          condition: selectedCondition,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add condition.");
      return;
    }

    // 2. Create FHIR Condition resource
    const fhirCondition = createConditionResource(
      loggedInUser.id,
      selectedCondition
    );

    // 3. Store FHIR Condition in backend
    const fhirResponse = await fetch(
      "http://localhost:5000/api/observations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fhirCondition),
      }
    );

    const fhirData = await fhirResponse.json();

    if (!fhirResponse.ok) {
      console.error("FHIR Condition storage error:", fhirData);
      alert(
        "Condition was saved, but FHIR Condition could not be stored."
      );
      await fetchConditions();
      return;
    }

    // 4. Refresh conditions
    setSelectedCondition("");
    await fetchConditions();

    alert("Condition and FHIR record added successfully.");
  } catch (error) {
    console.error("Condition add error:", error);
    alert("Unable to add condition.");
  }
};
  const getConditionName = (
    value: string
  ) => {
    const condition =
      availableConditions.find(
        (item) => item.value === value
      );

    return condition?.name || value;
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
              {loggedInUser.name
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <span className="user-name">
              {loggedInUser.name}
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
            Patient Portal
          </div>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span className="nav-icon">
              ▣
            </span>

            <span>
              Dashboard
            </span>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/monitoring")
            }
          >
            <span className="nav-icon">
              ♥
            </span>

            <span>
              Health Monitoring
            </span>
          </button>

          <button
            className="nav-item active"
            onClick={() =>
              navigate("/conditions")
            }
          >
            <span className="nav-icon">
              +
            </span>

            <span>
              My Conditions
            </span>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/history")
            }
          >
            <span className="nav-icon">
              ◷
            </span>

            <span>
              Health History
            </span>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/trends")
            }
          >
            <span className="nav-icon">
              ↗
            </span>

            <span>
              Health Trends
            </span>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/appointments")
            }
          >
            <span className="nav-icon">
              ▣
            </span>

            <span>
              Appointments
            </span>
          </button>

        </aside>


        {/* MAIN */}

        <main className="main-content">

          <div className="page-header">

            <h1>
              My Health Conditions
            </h1>

            <p>
              Select the health conditions you
              want to monitor regularly.
            </p>

          </div>


          {/* CURRENT CONDITIONS */}

          <div className="card">

            <h2>
              Your Conditions
            </h2>

            <p
              style={{
                color: "#64748b",
              }}
            >
              These conditions will appear
              automatically when you enter
              your daily readings.
            </p>


            {loading ? (

              <div className="empty-state">
                Loading conditions...
              </div>

            ) : conditions.length === 0 ? (

              <div className="empty-state">

                <h3>
                  No conditions added yet
                </h3>

                <p>
                  Add a condition below to
                  start health monitoring.
                </p>

              </div>

            ) : (

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                  marginTop: "18px",
                }}
              >

                {conditions.map(
                  (condition) => (

                    <div
                      key={condition.id}
                      style={{
                        padding: "16px",
                        border:
                          "1px solid #dce6ee",
                        borderRadius: "10px",
                        background:
                          "#f4f9fc",
                      }}
                    >

                      <strong
                        style={{
                          fontSize: "15px",
                        }}
                      >
                        {getConditionName(
                          condition.condition
                        )}
                      </strong>

                      <p
                        style={{
                          color: "#70859a",
                          fontSize: "12px",
                          marginTop: "6px",
                        }}
                      >
                        Active monitoring
                      </p>

                    </div>

                  )
                )}

              </div>

            )}

          </div>


          {/* ADD CONDITION */}

          <div
            className="card"
            style={{
              marginTop: "18px",
            }}
          >

            <h2>
              Add Another Condition
            </h2>

            <p
              style={{
                color: "#64748b",
              }}
            >
              You can add another condition
              whenever you need to monitor it.
            </p>

            <div
              className="form-group"
              style={{
                marginTop: "18px",
                maxWidth: "600px",
              }}
            >

              <label>
                Medical Condition
              </label>

              <select
                value={selectedCondition}
                onChange={(e) =>
                  setSelectedCondition(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select condition
                </option>

                {availableConditions
                  .filter(
                    (condition) =>
                      !conditions.some(
                        (saved) =>
                          saved.condition ===
                          condition.value
                      )
                  )
                  .map((condition) => (

                    <option
                      key={condition.value}
                      value={condition.value}
                    >
                      {condition.name}
                    </option>

                  ))}

              </select>

            </div>


            {selectedCondition && (

              <div
                style={{
                  padding: "12px 14px",
                  background: "#f0f9ff",
                  border:
                    "1px solid #bae6fd",
                  borderRadius: "8px",
                  maxWidth: "600px",
                  marginBottom: "15px",
                  color: "#0c4a6e",
                  fontSize: "13px",
                }}
              >
                {
                  availableConditions.find(
                    (item) =>
                      item.value ===
                      selectedCondition
                  )?.description
                }
              </div>

            )}


            <button
              className="primary-button"
              onClick={addCondition}
            >
              Add Condition
            </button>

          </div>


          {/* CONTINUE */}

          {conditions.length > 0 && (

            <div
              className="action-row"
              style={{
                marginTop: "18px",
              }}
            >

              <button
                className="primary-button"
                onClick={() =>
                  navigate("/monitoring")
                }
              >
                Go to Health Monitoring
              </button>

            </div>

          )}

        </main>

      </div>

    </div>
  );
}

export default Conditions;