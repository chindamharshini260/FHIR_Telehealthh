import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Appointment = {
  id: string;
  appointment_date: string;
  reason: string | null;
  status: string;
  patient_name: string;
  patient_email: string;
};

function DoctorAppointments() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<
    Appointment[]
  >([]);

  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
  );

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

    fetchAppointments();
  }, [navigate, loggedInUser?.id]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(
        `/api/appointments/doctor/${loggedInUser.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        return;
      }

      setAppointments(data);
    } catch (error) {
      console.error(
        "Appointment fetch error:",
        error
      );
    }
  };

  const updateStatus = async (
    appointmentId: string,
    status: string
  ) => {
    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update appointment.");
        return;
      }

      await fetchAppointments();
    } catch (error) {
      console.error(error);
      alert("Unable to update appointment.");
    }
  };

  const statusClass = (status: string) => {
    if (status === "approved") {
      return "status-badge status-low";
    }

    if (status === "cancelled") {
      return "status-badge status-high";
    }

    if (status === "completed") {
      return "status-badge status-neutral";
    }

    return "status-badge status-moderate";
  };

  return (
    <div className="app">

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

        <aside className="sidebar">

          <div className="sidebar-title">
            Doctor Portal
          </div>

          <button
            className="nav-item"
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
            className="nav-item active"
          >
            <span className="nav-icon">
              ◷
            </span>

            <span>
              Appointments
            </span>
          </button>

        </aside>

        <main className="main-content">

          <div className="page-header">

            <h1>
              Appointment Requests
            </h1>

            <p>
              Review and manage patient
              appointment requests.
            </p>

          </div>

          <div className="card">

            <h2>
              Patient Appointments
            </h2>

            {appointments.length === 0 ? (

              <div className="empty-state">

                <h3>
                  No appointments
                </h3>

                <p>
                  Patient appointment requests
                  will appear here.
                </p>

              </div>

            ) : (

              appointments.map(
                (appointment) => (
                  <div
                    key={appointment.id}
                    className="card"
                    style={{
                      marginTop: "18px",
                      background: "#f8fafc",
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
                          {appointment.patient_name}
                        </h2>

                        <p
                          style={{
                            color:
                              "#64748b",
                            fontSize:
                              "13px",
                          }}
                        >
                          {
                            appointment.patient_email
                          }
                        </p>

                      </div>

                      <span
                        className={statusClass(
                          appointment.status
                        )}
                      >
                        {appointment.status
                          .charAt(0)
                          .toUpperCase() +
                          appointment.status.slice(
                            1
                          )}
                      </span>

                    </div>

                    <p>
                      <strong>
                        Date:
                      </strong>{" "}
                      {new Date(
                        appointment.appointment_date
                      ).toLocaleString()}
                    </p>

                    {appointment.reason && (
                      <p>
                        <strong>
                          Reason:
                        </strong>{" "}
                        {appointment.reason}
                      </p>
                    )}

                    {appointment.status ===
                      "pending" && (
                      <div className="action-row">

                        <button
                          className="primary-button"
                          onClick={() =>
                            updateStatus(
                              appointment.id,
                              "approved"
                            )
                          }
                        >
                          Approve
                        </button>

                        <button
                          className="secondary-button"
                          onClick={() =>
                            updateStatus(
                              appointment.id,
                              "cancelled"
                            )
                          }
                        >
                          Cancel
                        </button>

                      </div>
                    )}

                    {appointment.status ===
                      "approved" && (
                      <button
                        className="secondary-button"
                        onClick={() =>
                          updateStatus(
                            appointment.id,
                            "completed"
                          )
                        }
                      >
                        Mark Completed
                      </button>
                    )}

                  </div>
                )
              )

            )}

          </div>

        </main>

      </div>

    </div>
  );
}

export default DoctorAppointments;