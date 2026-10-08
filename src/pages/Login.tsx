import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "doctor") {
      setEmail("doctor@example.com");
      setPassword("password");
    } else if (role === "admin") {
      setEmail("admin@test.com");
      setPassword("password");
    } else if (role === "patient") {
      setEmail("patient@example.com");
      setPassword("password");
    }
  }, [searchParams]);

  const setDemoCredentials = (role: "patient" | "doctor" | "admin") => {
    if (role === "doctor") {
      setEmail("doctor@example.com");
      setPassword("password");
    } else if (role === "admin") {
      setEmail("admin@test.com");
      setPassword("password");
    } else {
      setEmail("patient@example.com");
      setPassword("password");
    }
    setMessage("");
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Please enter email and password.");
      return;
    }

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed.");
        return;
      }

      localStorage.setItem(
        "loggedInUser",
        JSON.stringify(data.user)
      );

      // Send users to the correct portal based on role
      const userRole = (data.user?.role || "").toLowerCase().trim();
      if (userRole === "doctor") {
        navigate("/doctor");
      } else if (userRole === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <div className="logo-icon" style={{ margin: "0 auto 12px" }}>
            +
          </div>

          <h1>FHIR Telehealth</h1>

          <p>
            Secure digital healthcare & remote monitoring
          </p>
        </div>

        <h2 style={{ marginBottom: "6px" }}>
          Welcome back
        </h2>

        <p
          style={{
            color: "#64748b",
            fontSize: "14px",
            marginBottom: "25px",
          }}
        >
          Sign in to access your healthcare dashboard.
        </p>

        <div className="form-group">
          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />
        </div>

        {message && (
          <p
            style={{
              color: "#dc2626",
              fontSize: "13px",
              marginBottom: "15px",
            }}
          >
            {message}
          </p>
        )}

        <button
          className="primary-button"
          style={{
            width: "100%",
            padding: "12px",
          }}
          onClick={handleLogin}
        >
          Sign In
        </button>

        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
            Quick Demo Fill:
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <button
              type="button"
              className="secondary-button"
              style={{ fontSize: "12px", padding: "4px 8px" }}
              onClick={() => setDemoCredentials("patient")}
            >
              🧑 Patient
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{ fontSize: "12px", padding: "4px 8px" }}
              onClick={() => setDemoCredentials("doctor")}
            >
              👨‍⚕️ Doctor
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{ fontSize: "12px", padding: "4px 8px" }}
              onClick={() => setDemoCredentials("admin")}
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "25px",
            paddingTop: "20px",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <p
            style={{
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Don't have a patient account?
          </p>

          <button
            className="secondary-button"
            style={{
              width: "100%",
            }}
            onClick={() => navigate("/signup")}
          >
            Create Patient Account
          </button>
        </div>

      </div>
    </div>
  );
}

export default Login;