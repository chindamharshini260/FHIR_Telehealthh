import express from "express";
import cors from "cors";
import { pool } from "./config/db";
import bcrypt from "bcrypt";
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "FHIR Telehealth Backend is running",
  });
});

app.post("/api/observations", async (req, res) => {
  try {
    const observation = req.body;

    if (!observation || !observation.resourceType) {
      return res.status(400).json({
        message: "Invalid FHIR resource",
      });
    }

    let patientId: string | null = null;

    // Normal Observation
   if (
  observation.resourceType === "Observation" ||
  observation.resourceType === "Condition"
) {
  patientId =
    observation.subject?.reference?.replace(
      "Patient/",
      ""
    ) || null;
}

if (observation.resourceType === "Bundle") {
  const firstResource =
    observation.entry?.[0]?.resource;

  patientId =
    firstResource?.subject?.reference?.replace(
      "Patient/",
      ""
    ) || null;
}
    if (!patientId) {
      return res.status(400).json({
        message: "Patient reference missing from FHIR resource",
      });
    }

    const result = await pool.query(
      `INSERT INTO fhir_observations
       (patient_id, resource_type, fhir_resource)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        patientId,
        observation.resourceType,
        observation,
      ]
    );

    res.status(201).json({
      message: "FHIR resource stored successfully",
      observation: result.rows[0],
    });
  } catch (error) {
    console.error(
      "FHIR observation storage error:",
      error
    );

    res.status(500).json({
      message: "Failed to store FHIR resource",
    });
  }
});
app.get("/api/fhir-observations", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        patient_id,
        resource_type,
        fhir_resource,
        created_at
       FROM fhir_observations
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("FHIR observations fetch error:", error);

    res.status(500).json({
      message: "Failed to fetch FHIR observations",
    });
  }
});

const PORT = 5000;

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Neon PostgreSQL connected successfully",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'patient')
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash]
    );

    res.status(201).json({
      message: "Patient account created successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      message: "Server error during signup",
    });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error during login",
    });
  }
});
app.post("/api/health-readings", async (req, res) => {
  try {
    const {
      patientId,
      condition,
      readings,
    } = req.body;

    if (!patientId || !condition || !readings) {
      return res.status(400).json({
        message: "Patient ID, condition and readings are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO health_readings
       (patient_id, condition, readings)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        patientId,
        condition,
        readings,
      ]
    );

    res.status(201).json({
      message: "Health reading saved successfully",
      reading: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Health reading save error:",
      error
    );

    res.status(500).json({
      message: "Failed to save health reading",
    });
  }
});
app.get("/api/health-readings/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM health_readings
       WHERE patient_id = $1
       ORDER BY recorded_at DESC`,
      [patientId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch health readings error:", error);

    res.status(500).json({
      message: "Failed to fetch health readings",
    });
  }
});
app.get("/api/doctor/health-readings", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        hr.id,
        hr.patient_id,
        u.name AS patient_name,
        hr.condition,
        hr.readings,
        hr.recorded_at
       FROM health_readings hr
       JOIN users u
       ON hr.patient_id = u.id
       ORDER BY hr.recorded_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Doctor health readings error:", error);

    res.status(500).json({
      message: "Failed to fetch patient health records",
    });
  }
});
// Create appointment
app.post("/api/appointments", async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentDate,
      reason,
    } = req.body;

    if (
      !patientId ||
      !doctorId ||
      !appointmentDate
    ) {
      return res.status(400).json({
        message:
          "Patient, doctor and appointment date are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO appointments
       (patient_id, doctor_id, appointment_date, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        patientId,
        doctorId,
        appointmentDate,
        reason || null,
      ]
    );

    res.status(201).json({
      message: "Appointment requested successfully",
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Create appointment error:",
      error
    );

    res.status(500).json({
      message: "Failed to create appointment",
    });
  }
});


// Get patient appointments
app.get(
  "/api/appointments/patient/:patientId",
  async (req, res) => {
    try {
      const { patientId } = req.params;

      const result = await pool.query(
        `SELECT
          a.id,
          a.appointment_date,
          a.reason,
          a.status,
          a.created_at,
          u.name AS doctor_name,
          u.email AS doctor_email
         FROM appointments a
         JOIN users u
         ON a.doctor_id = u.id
         WHERE a.patient_id = $1
         ORDER BY a.appointment_date DESC`,
        [patientId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error(
        "Patient appointments error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch appointments",
      });
    }
  }
);


// Get doctor appointments
app.get(
  "/api/appointments/doctor/:doctorId",
  async (req, res) => {
    try {
      const { doctorId } = req.params;

      const result = await pool.query(
        `SELECT
          a.id,
          a.appointment_date,
          a.reason,
          a.status,
          a.created_at,
          u.name AS patient_name,
          u.email AS patient_email
         FROM appointments a
         JOIN users u
         ON a.patient_id = u.id
         WHERE a.doctor_id = $1
         ORDER BY a.appointment_date DESC`,
        [doctorId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error(
        "Doctor appointments error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch appointments",
      });
    }
  }
);
// Get conditions selected by a patient
app.get(
  "/api/patient-conditions/:patientId",
  async (req, res) => {
    try {
      const { patientId } = req.params;

      const result = await pool.query(
        `SELECT
          id,
          condition,
          created_at
         FROM patient_conditions
         WHERE patient_id = $1
         ORDER BY created_at ASC`,
        [patientId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error(
        "Fetch patient conditions error:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch patient conditions",
      });
    }
  }
);


// Add a condition for a patient
app.post(
  "/api/patient-conditions",
  async (req, res) => {
    try {
      const {
        patientId,
        condition,
      } = req.body;

      if (!patientId || !condition) {
        return res.status(400).json({
          message:
            "Patient ID and condition are required",
        });
      }

      const allowedConditions = [
        "hypertension",
        "diabetes",
        "COPD",
      ];

      if (!allowedConditions.includes(condition)) {
        return res.status(400).json({
          message: "Invalid medical condition",
        });
      }

      const result = await pool.query(
        `INSERT INTO patient_conditions
         (patient_id, condition)
         VALUES ($1, $2)
         ON CONFLICT (patient_id, condition)
         DO NOTHING
         RETURNING *`,
        [patientId, condition]
      );

      if (result.rows.length === 0) {
        return res.status(200).json({
          message: "Condition already added",
        });
      }

      res.status(201).json({
        message: "Condition added successfully",
        condition: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Add patient condition error:",
        error
      );

      res.status(500).json({
        message: "Failed to add patient condition",
      });
    }
  }
);
app.patch("/api/appointments/:appointmentId/status", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "approved",
      "cancelled",
      "completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid appointment status",
      });
    }

    const result = await pool.query(
      `UPDATE appointments
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, appointmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    res.json({
      message: "Appointment status updated",
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Appointment status update error:",
      error
    );

    res.status(500).json({
      message: "Failed to update appointment",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});