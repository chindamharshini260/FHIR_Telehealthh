import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

type PatientCondition = {
  id: string;
  condition: string;
  created_at: string;
};

const availableConditions = [
  {
    value: "hypertension",
    name: "Hypertension",
    icon: "♥",
    description: "Monitor blood pressure and heart rate",
  },
  {
    value: "diabetes",
    name: "Diabetes",
    icon: "●",
    description: "Monitor blood glucose levels",
  },
  {
    value: "COPD",
    name: "COPD",
    icon: "♢",
    description: "Monitor oxygen and breathing",
  },
  {
    value: "heart_disease",
    name: "Heart Disease",
    icon: "♥",
    description: "Monitor cardiovascular health",
  },
  {
    value: "asthma",
    name: "Asthma",
    icon: "♨",
    description: "Monitor breathing and oxygen levels",
  },
  {
    value: "CKD",
    name: "Chronic Kidney Disease",
    icon: "◆",
    description: "Monitor kidney-related health parameters",
  },
  {
    value: "obesity",
    name: "Obesity",
    icon: "●",
    description: "Monitor weight and BMI",
  },
  {
    value: "thyroid",
    name: "Thyroid Disorder",
    icon: "◇",
    description: "Monitor thyroid hormone levels",
  },
];

function Conditions() {
  const navigate = useNavigate();

  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
  );

  const [conditions, setConditions] = useState<
    PatientCondition[]
  >([]);

  const [adding, setAdding] = useState("");

  const [showHypertensionForm, setShowHypertensionForm] =
  useState(false);

const [hypertensionProfile, setHypertensionProfile] =
  useState({
    male: "",
    age: "",
    currentSmoker: "",
    cigsPerDay: "",
    BPMeds: "",
    diabetes: "",
    totChol: "",
    BMI: "",
    glucose: "",
  });
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

    fetchConditions();
  }, [navigate, loggedInUser?.id]);

  const fetchConditions = async () => {
    try {
      const response = await fetch(
        `/api/patient-conditions/${loggedInUser.id}`
      );

      const data = await response.json();

      if (response.ok) {
        setConditions(data);
      }
    } catch (error) {
      console.error("Condition fetch error:", error);
    }
  };

 const addCondition = async (
  condition: string,
  mlProfile?: any
) => {
  setAdding(condition);

  try {
    const response = await fetch(
      "/api/patient-conditions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: loggedInUser.id,
          condition,
          mlProfile,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data.message ||
        "Failed to add condition"
      );
      return;
    }

    await fetchConditions();

    setShowHypertensionForm(false);

    setHypertensionProfile({
      male: "",
      age: "",
      currentSmoker: "",
      cigsPerDay: "",
      BPMeds: "",
      diabetes: "",
      totChol: "",
      BMI: "",
      glucose: "",
    });

  } catch (error) {
    console.error(
      "Add condition error:",
      error
    );

    alert("Unable to add condition");

  } finally {
    setAdding("");
  }
};

  const isAdded = (condition: string) => {
    return conditions.some(
      (item) =>
        item.condition.toLowerCase() ===
        condition.toLowerCase()
    );
  };

  return (
    <div className="app">

      <header className="top-header">

        <div className="logo">
          <div className="logo-icon">+</div>

          <div>
            <div>FHIR Telehealth</div>
            <small>Remote Healthcare</small>
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

            <div>
              <div className="section-kicker">
                HEALTH PROFILE
              </div>

              <h1>
                My Health Conditions
              </h1>

              <p>
                Select the conditions you want to
                monitor regularly.
              </p>
            </div>

          </div>

          {/* CURRENT CONDITIONS */}

          <div className="dashboard-panel">

            <div className="panel-heading">

              <div>
                <h2>
                  Your Conditions
                </h2>

                <p>
                  Conditions currently being monitored
                </p>
              </div>

              <span className="monitor-active-badge">
                {conditions.length} Active
              </span>

            </div>

            {conditions.length === 0 ? (

              <div className="monitor-empty">
                <div className="monitor-empty-icon">
                  +
                </div>

                <h3>
                  No conditions added
                </h3>

                <p>
                  Select a condition below to begin
                  monitoring.
                </p>
              </div>

            ) : (

              <div className="condition-cards">

                {conditions.map((item) => {

                  const condition =
                    availableConditions.find(
                      (c) =>
                        c.value.toLowerCase() ===
                        item.condition.toLowerCase()
                    );

                  return (
                    <div
                      className="condition-card condition-active"
                      key={item.id}
                    >

                      <div className="condition-icon">
                        {condition?.icon || "♥"}
                      </div>

                      <div>
                        <strong>
                          {condition?.name ||
                            item.condition}
                        </strong>

                        <span>
                          Active Monitoring
                        </span>
                      </div>

                      <div className="condition-check">
                        ✓
                      </div>

                    </div>
                  );
                })}

              </div>

            )}

          </div>

          {/* ADD CONDITIONS */}

          <div
            className="dashboard-panel"
            style={{ marginTop: "18px" }}
          >

            <div className="panel-heading">

              <div>
                <h2>
                  Add Another Condition
                </h2>

                <p>
                  Choose a condition to include in
                  your daily monitoring.
                </p>
              </div>

            </div>

            <div className="condition-selection-grid">

              {availableConditions.map(
                (condition) => {

                  const added = isAdded(
                    condition.value
                  );

                  const isAdding =
                    adding === condition.value;

                  return (
                    <div
                      className={`condition-option ${
                        added
                          ? "condition-option-added"
                          : ""
                      }`}
                      key={condition.value}
                    >

                      <div className="condition-option-icon">
                        {condition.icon}
                      </div>

                      <div className="condition-option-content">

                        <strong>
                          {condition.name}
                        </strong>

                        <span>
                          {condition.description}
                        </span>

                      </div>

                      <button
                        className={
                          added
                            ? "condition-added-button"
                            : "condition-add-button"
                        }
                        disabled={
                          added || isAdding
                        }
                        onClick={() => {
  if (condition.value === "hypertension") {
    setShowHypertensionForm(true);
  } else {
    addCondition(condition.value);
  }
}}
                      >
                        {added
                          ? "Added ✓"
                          : isAdding
                          ? "Adding..."
                          : "Add"}
                      </button>

                    </div>
                  );
                }
              )}

            </div>

            {showHypertensionForm && (
  <div
    className="dashboard-panel"
    style={{
      marginBottom: "18px",
      padding: "20px",
    }}
  >
    <div className="panel-heading">
      <div>
        <h2>Hypertension Profile</h2>
        <p>
          Enter these details once for hypertension
          risk analysis.
        </p>
      </div>
    </div>

    <div className="form-grid">

      <div className="form-group">
        <label>Sex</label>
        <select
          value={hypertensionProfile.male}
          onChange={(e) =>
            setHypertensionProfile({
              ...hypertensionProfile,
              male: e.target.value,
            })
          }
        >
          <option value="">Select</option>
          <option value="1">Male</option>
          <option value="0">Female</option>
        </select>
      </div>

      <div className="form-group">
        <label>Age</label>
        <input
          type="number"
          value={hypertensionProfile.age}
          onChange={(e) =>
            setHypertensionProfile({
              ...hypertensionProfile,
              age: e.target.value,
            })
          }
          placeholder="Age"
        />
      </div>

      <div className="form-group">
        <label>Current Smoker?</label>
        <select
          value={hypertensionProfile.currentSmoker}
          onChange={(e) =>
            setHypertensionProfile({
              ...hypertensionProfile,
              currentSmoker: e.target.value,
            })
          }
        >
          <option value="">Select</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      </div>

      <div className="form-group">
        <label>Cigarettes per Day</label>
        <input
          type="number"
          value={hypertensionProfile.cigsPerDay}
          onChange={(e) =>
            setHypertensionProfile({
              ...hypertensionProfile,
              cigsPerDay: e.target.value,
            })
          }
          placeholder="0"
        />
      </div>

      <div className="form-group">
        <label>BP Medication?</label>
        <select
          value={hypertensionProfile.BPMeds}
          onChange={(e) =>
            setHypertensionProfile({
              ...hypertensionProfile,
              BPMeds: e.target.value,
            })
          }
        >
          <option value="">Select</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      </div>

      <div className="form-group">
        <label>Diabetes?</label>
        <select
          value={hypertensionProfile.diabetes}
          onChange={(e) =>
            setHypertensionProfile({
              ...hypertensionProfile,
              diabetes: e.target.value,
            })
          }
        >
          <option value="">Select</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      </div>

      <div className="form-group">
        <label>Total Cholesterol</label>
        <input
          type="number"
          value={hypertensionProfile.totChol}
          onChange={(e) =>
            setHypertensionProfile({
              ...hypertensionProfile,
              totChol: e.target.value,
            })
          }
          placeholder="mg/dL"
        />
      </div>

      <div className="form-group">
        <label>BMI</label>
        <input
          type="number"
          step="0.1"
          value={hypertensionProfile.BMI}
          onChange={(e) =>
            setHypertensionProfile({
              ...hypertensionProfile,
              BMI: e.target.value,
            })
          }
          placeholder="BMI"
        />
      </div>

      <div className="form-group">
        <label>Glucose</label>
        <input
          type="number"
          value={hypertensionProfile.glucose}
          onChange={(e) =>
            setHypertensionProfile({
              ...hypertensionProfile,
              glucose: e.target.value,
            })
          }
          placeholder="mg/dL"
        />
      </div>

    </div>

    <div
      style={{
        display: "flex",
        gap: "10px",
        marginTop: "18px",
      }}
    >
      <button
        className="primary-button"
        onClick={() => {
          const profile = {
            male: Number(
              hypertensionProfile.male
            ),
            age: Number(
              hypertensionProfile.age
            ),
            currentSmoker: Number(
              hypertensionProfile.currentSmoker
            ),
            cigsPerDay: Number(
              hypertensionProfile.cigsPerDay
            ),
            BPMeds: Number(
              hypertensionProfile.BPMeds
            ),
            diabetes: Number(
              hypertensionProfile.diabetes
            ),
            totChol: Number(
              hypertensionProfile.totChol
            ),
            BMI: Number(
              hypertensionProfile.BMI
            ),
            glucose: Number(
              hypertensionProfile.glucose
            ),
          };

          addCondition(
            "hypertension",
            profile
          );
        }}
      >
        Save Hypertension Profile
      </button>

      <button
        className="secondary-button"
        onClick={() =>
          setShowHypertensionForm(false)
        }
      >
        Cancel
      </button>
    </div>
  </div>
)}

          </div>

          {/* CONTINUE */}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "18px",
            }}
          >

            <button
              className="primary-button"
              onClick={() =>
                navigate("/monitoring")
              }
            >
              Continue to Monitoring →
            </button>

          </div>

        </main>

      </div>

    </div>
  );
}

export default Conditions;