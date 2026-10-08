import "./App.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import HealthMonitoring from "./pages/HealthMonitoring";
import HealthHistory from "./pages/HealthHistory";
import HealthTrends from "./pages/HealthTrends";

import Appointments from "./pages/Appointments";

import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorAppointments from "./pages/DoctorAppointments";
import Conditions from "./pages/Conditions";
import AdminDashboard from "./pages/AdminDashboard";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Patient Authentication */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/signup"
          element={<Signup />}
        />


        {/* Patient Portal */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/monitoring"
          element={<HealthMonitoring />}
        />

        <Route
  path="/conditions"
  element={<Conditions />}
/>

        <Route
          path="/history"
          element={<HealthHistory />}
        />

        <Route
          path="/trends"
          element={<HealthTrends />}
        />

        <Route
          path="/appointments"
          element={<Appointments />}
        />


        {/* Doctor Portal */}

        <Route
          path="/doctor"
          element={<DoctorDashboard />}
        />

        <Route
          path="/doctor/appointments"
          element={<DoctorAppointments />}
        />

        {/* Admin Portal */}
        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;