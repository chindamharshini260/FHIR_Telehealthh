import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setMessage("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        "/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Signup failed.");
        return;
      }

      setMessage("Account created successfully!");

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <div
            className="logo-icon"
            style={{
              margin: "0 auto 12px",
            }}
          >
            +
          </div>

          <h1>FHIR Telehealth</h1>

          <p>
            Create your secure patient account
          </p>
        </div>

        <h2 style={{ marginBottom: "6px" }}>
          Create Account
        </h2>

        <p
          style={{
            color: "#64748b",
            fontSize: "14px",
            marginBottom: "25px",
          }}
        >
          Enter your details to get started.
        </p>

        <div className="form-group">
          <label>Full Name</label>

          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />
        </div>

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
            placeholder="Create a password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>

          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
          />
        </div>

        {message && (
          <p
            style={{
              color: message.includes("success")
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
          style={{
            width: "100%",
            padding: "12px",
          }}
          onClick={handleSignup}
        >
          Create Patient Account
        </button>

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
            Already have an account?
          </p>

          <button
            className="secondary-button"
            style={{
              width: "100%",
            }}
            onClick={() => navigate("/")}
          >
            Back to Login
          </button>
        </div>

      </div>
    </div>
  );
}

export default Signup;