import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

type Doctor = {
  id: string;
  name: string;
  email: string;
};

type Appointment = {
  id: string;
  appointment_date: string;
  reason: string | null;
  status: string;
  doctor_name: string;
  doctor_email: string;
};

function Appointments() {
  const navigate = useNavigate();

  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
  );

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] =
    useState("");
  const [reason, setReason] = useState("");

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loggedInUser) {
      navigate("/");
      return;
    }

    fetchDoctors();
    fetchAppointments();
  }, [navigate, loggedInUser?.id]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/doctors"
      );

      const data = await response.json();

      if (response.ok) {
        setDoctors(data);
      }
    } catch (error) {
      console.error("Doctor fetch error:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/appointments/patient/${loggedInUser.id}`
      );

      const data = await response.json();

      if (response.ok) {
        setAppointments(data);
      }
    } catch (error) {
      console.error(
        "Appointment fetch error:",
        error
      );
    }
  };

  const requestAppointment = async () => {
    if (!doctorId || !appointmentDate) {
      setMessage(
        "Please select a doctor and appointment date."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/appointments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientId: loggedInUser.id,
            doctorId,
            appointmentDate,
            reason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Failed to request appointment."
        );
        setSaving(false);
        return;
      }

      setMessage(
        "Appointment requested successfully."
      );

      setDoctorId("");
      setAppointmentDate("");
      setReason("");

      await fetchAppointments();
    } catch (error) {
      console.error(error);
      setMessage(
        "Unable to connect to server."
      );
    }

    setSaving(false);
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
              Appointments
            </h1>

            <p>
              Schedule and manage your
              healthcare appointments.
            </p>

          </div>

          {/* Request Appointment */}

          <div className="form-card">

            <h2>
              Request an Appointment
            </h2>

            <div className="form-group">

              <label>
                Select Doctor
              </label>

              <select
                value={doctorId}
                onChange={(e) =>
                  setDoctorId(e.target.value)
                }
              >

                <option value="">
                  Select a doctor
                </option>

                {doctors.map((doctor) => (
                  <option
                    key={doctor.id}
                    value={doctor.id}
                  >
                    {doctor.name}
                  </option>
                ))}

              </select>

            </div>

            <div className="form-group">

              <label>
                Appointment Date & Time
              </label>

              <input
                type="datetime-local"
                value={appointmentDate}
                onChange={(e) =>
                  setAppointmentDate(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="form-group">

              <label>
                Reason for Visit
              </label>

              <input
                type="text"
                placeholder="e.g. Follow-up consultation"
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value)
                }
              />

            </div>

            {message && (
              <p
                style={{
                  color: message.includes(
                    "successfully"
                  )
                    ? "#16a34a"
                    : "#dc2626",
                  fontSize: "13px",
                  marginBottom: "15px",
                }}
              >
                {message}
              </p>
            )}

            <button
              className="primary-button"
              onClick={requestAppointment}
              disabled={saving}
            >
              {saving
                ? "Requesting..."
                : "Request Appointment"}
            </button>

          </div>

          {/* Existing Appointments */}

          <div
            className="card"
            style={{ marginTop: "24px" }}
          >

            <h2>
              My Appointments
            </h2>

            {appointments.length === 0 ? (

              <div className="empty-state">

                <h3>
                  No appointments
                </h3>

                <p>
                  Your appointment requests
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
                      marginTop: "15px",
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
                        gap: "15px",
                        flexWrap:
                          "wrap",
                      }}
                    >

                      <div>

                        <h3>
                          {
                            appointment.doctor_name
                          }
                        </h3>

                        <p
                          style={{
                            color:
                              "#64748b",
                            fontSize:
                              "13px",
                          }}
                        >
                          {
                            appointment.doctor_email
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

export default Appointments;