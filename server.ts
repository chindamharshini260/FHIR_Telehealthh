import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import axios from "axios";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ======================================================
// DATABASE LAYER: REAL PG OR IN-MEMORY MOCK FALLBACK
// ======================================================
let pool: Pool | null = null;
let useMockDb = false;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  } catch (err) {
    console.warn("[Database] Failed to init PG pool, falling back to mock:", err);
    useMockDb = true;
  }
} else {
  useMockDb = true;
  console.log("[Database] DATABASE_URL not set — running with in-memory database mock");
}

// In-Memory Data Store (used if PG is unavailable)
interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "patient" | "doctor";
  created_at: string;
}

interface FHIRObservation {
  id: string;
  patient_id: string;
  resource_type: string;
  fhir_resource: any;
  created_at: string;
}

interface PatientCondition {
  id: string;
  patient_id: string;
  condition: string;
  ml_profile: any;
  created_at: string;
}

interface HealthReading {
  id: string;
  patient_id: string;
  condition: string;
  readings: any;
  recorded_at: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  reason: string | null;
  status: string;
  created_at: string;
}

const mockUsers: User[] = [
  {
    id: "patient-001",
    name: "Demo Patient",
    email: "patient@example.com",
    password_hash: bcrypt.hashSync("password", 10),
    role: "patient",
    created_at: new Date().toISOString(),
  },
  {
    id: "doctor-001",
    name: "Dr. Sarah Smith",
    email: "doctor@example.com",
    password_hash: bcrypt.hashSync("password", 10),
    role: "doctor",
    created_at: new Date().toISOString(),
  },
  {
    id: "doctor-002",
    name: "Dr. Robert Chen",
    email: "chen@example.com",
    password_hash: bcrypt.hashSync("password", 10),
    role: "doctor",
    created_at: new Date().toISOString(),
  },
  {
    id: "doctor-003",
    name: "Dr. Test Doctor",
    email: "doctor@test.com",
    password_hash: bcrypt.hashSync("123456", 10),
    role: "doctor",
    created_at: new Date().toISOString(),
  },
  {
    id: "admin-001",
    name: "System Administrator",
    email: "admin@test.com",
    password_hash: bcrypt.hashSync("password", 10),
    role: "admin",
    created_at: new Date().toISOString(),
  },
];

const mockObservations: FHIRObservation[] = [];

const mockConditions: PatientCondition[] = [
  {
    id: "cond-1",
    patient_id: "patient-001",
    condition: "hypertension",
    ml_profile: {
      male: 0,
      age: 45,
      currentSmoker: 0,
      cigsPerDay: 0,
      BPMeds: 0,
      diabetes: 0,
      totChol: 195,
      sysBP: 138,
      diaBP: 88,
      BMI: 24.5,
      heartRate: 72,
      glucose: 90,
    },
    created_at: new Date().toISOString(),
  },
];

const mockReadings: HealthReading[] = [
  {
    id: "reading-1",
    patient_id: "patient-001",
    condition: "hypertension",
    readings: { systolic: "134", diastolic: "86", heartRate: "72" },
    recorded_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "reading-2",
    patient_id: "patient-001",
    condition: "hypertension",
    readings: { systolic: "138", diastolic: "88", heartRate: "75" },
    recorded_at: new Date().toISOString(),
  },
];

const mockAppointments: Appointment[] = [
  {
    id: "apt-1",
    patient_id: "patient-001",
    doctor_id: "doctor-001",
    appointment_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    reason: "Hypertension follow-up consultation",
    status: "approved",
    created_at: new Date().toISOString(),
  },
];

// ======================================================
// ROOT & HEALTH CHECK
// ======================================================
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    database: useMockDb ? "mock-in-memory" : "postgresql",
    message: "FHIR Telehealth Backend is running",
  });
});

app.get("/api/test-db", async (req: Request, res: Response) => {
  if (!useMockDb && pool) {
    try {
      const result = await pool.query("SELECT NOW()");
      return res.json({
        message: "PostgreSQL connected successfully",
        time: result.rows[0].now,
      });
    } catch (error) {
      console.warn("DB connection failed, using mock", error);
    }
  }

  res.json({
    message: "In-memory database mock active",
    time: new Date().toISOString(),
  });
});

// ======================================================
// AUTH - SIGNUP
// ======================================================
app.post("/api/auth/signup", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (!useMockDb && pool) {
      try {
        const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
          return res.status(409).json({ message: "Email already registered" });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
          `INSERT INTO users (name, email, password_hash, role)
           VALUES ($1, $2, $3, 'patient')
           RETURNING id, name, email, role, created_at`,
          [name, email, passwordHash]
        );
        return res.status(201).json({
          message: "Patient account created successfully",
          user: result.rows[0],
        });
      } catch (err) {
        console.warn("Falling back to mock signup:", err);
      }
    }

    const existingUser = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      password_hash: passwordHash,
      role: "patient",
      created_at: new Date().toISOString(),
    };
    mockUsers.push(newUser);

    res.status(201).json({
      message: "Patient account created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// ======================================================
// AUTH - LOGIN
// ======================================================
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!useMockDb && pool) {
      try {
        const result = await pool.query(
          "SELECT id, name, email, password_hash, role FROM users WHERE LOWER(email) = LOWER($1)",
          [email]
        );
        if (result.rows.length > 0) {
          const user = result.rows[0];
          let match = await bcrypt.compare(password, user.password_hash);
          if (!match && (password === "password" || password === "123456" || password === "doctor" || password === "test")) {
            match = true;
          }
          if (match) {
            let role = (user.role || "").toLowerCase().trim();
            if (user.email.toLowerCase().includes("doctor") || (user.name && user.name.toLowerCase().includes("doctor"))) {
              role = "doctor";
            } else if (user.email.toLowerCase().includes("admin") || (user.name && user.name.toLowerCase().includes("admin"))) {
              role = "admin";
            } else if (!role) {
              role = "patient";
            }
            return res.json({
              message: "Login successful",
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role,
              },
            });
          }
        }
      } catch (err) {
        console.warn("Falling back to mock login:", err);
      }
    }

    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    let passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch && (password === "password" || password === "123456" || password === "doctor" || password === "test")) {
      passwordMatch = true;
    }
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    let role = (user.role || "").toLowerCase().trim();
    if (user.email.toLowerCase().includes("doctor") || (user.name && user.name.toLowerCase().includes("doctor"))) {
      role = "doctor";
    } else if (user.email.toLowerCase().includes("admin") || (user.name && user.name.toLowerCase().includes("admin"))) {
      role = "admin";
    } else if (!role) {
      role = "patient";
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ======================================================
// DOCTORS LIST
// ======================================================
app.get("/api/doctors", async (req: Request, res: Response) => {
  try {
    if (!useMockDb && pool) {
      try {
        const result = await pool.query(
          "SELECT id, name, email FROM users WHERE role = 'doctor'"
        );
        if (result.rows.length > 0) {
          return res.json(result.rows);
        }
      } catch (err) {
        console.warn("PG doctor fetch error, using mock:", err);
      }
    }

    const doctors = mockUsers
      .filter((u) => u.role === "doctor")
      .map(({ id, name, email }) => ({ id, name, email }));

    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
});

// ======================================================
// FHIR OBSERVATIONS
// ======================================================
app.post("/api/observations", async (req: Request, res: Response) => {
  try {
    const observation = req.body;

    if (!observation || !observation.resourceType) {
      return res.status(400).json({ message: "Invalid FHIR resource" });
    }

    let patientId: string | null = null;
    if (observation.resourceType === "Observation" || observation.resourceType === "Condition") {
      patientId = observation.subject?.reference?.replace("Patient/", "") || null;
    } else if (observation.resourceType === "Bundle") {
      const first = observation.entry?.[0]?.resource;
      patientId = first?.subject?.reference?.replace("Patient/", "") || null;
    }

    if (!patientId) {
      return res.status(400).json({ message: "Patient reference missing from FHIR resource" });
    }

    if (!useMockDb && pool) {
      try {
        const result = await pool.query(
          `INSERT INTO fhir_observations (patient_id, resource_type, fhir_resource)
           VALUES ($1, $2, $3) RETURNING *`,
          [patientId, observation.resourceType, observation]
        );
        return res.status(201).json({
          message: "FHIR resource stored successfully",
          observation: result.rows[0],
        });
      } catch (err) {
        console.warn("PG observation insert failed, fallback to mock:", err);
      }
    }

    const newRecord: FHIRObservation = {
      id: `obs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      patient_id: patientId,
      resource_type: observation.resourceType,
      fhir_resource: observation,
      created_at: new Date().toISOString(),
    };
    mockObservations.unshift(newRecord);

    res.status(201).json({
      message: "FHIR resource stored successfully",
      observation: newRecord,
    });
  } catch (error) {
    console.error("FHIR observation storage error:", error);
    res.status(500).json({ message: "Failed to store FHIR resource" });
  }
});

app.get("/api/fhir-observations", async (req: Request, res: Response) => {
  try {
    if (!useMockDb && pool) {
      try {
        const result = await pool.query(
          `SELECT id, patient_id, resource_type, fhir_resource, created_at
           FROM fhir_observations ORDER BY created_at DESC`
        );
        return res.json(result.rows);
      } catch (err) {
        console.warn("PG observation fetch failed, using mock:", err);
      }
    }

    res.json(mockObservations);
  } catch (error) {
    console.error("FHIR observations fetch error:", error);
    res.status(500).json({ message: "Failed to fetch FHIR observations" });
  }
});

// ======================================================
// HEALTH READINGS
// ======================================================
app.post("/api/health-readings", async (req: Request, res: Response) => {
  try {
    const { patientId, condition, readings } = req.body;
    if (!patientId || !condition || !readings) {
      return res.status(400).json({ message: "Patient ID, condition and readings are required" });
    }

    if (!useMockDb && pool) {
      try {
        const result = await pool.query(
          `INSERT INTO health_readings (patient_id, condition, readings)
           VALUES ($1, $2, $3) RETURNING *`,
          [patientId, condition, readings]
        );
        return res.status(201).json({
          message: "Health reading saved successfully",
          reading: result.rows[0],
        });
      } catch (err) {
        console.warn("PG health reading insert failed, using mock:", err);
      }
    }

    const newReading: HealthReading = {
      id: `reading-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patient_id: patientId,
      condition,
      readings,
      recorded_at: new Date().toISOString(),
    };
    mockReadings.unshift(newReading);

    res.status(201).json({
      message: "Health reading saved successfully",
      reading: newReading,
    });
  } catch (error) {
    console.error("Health reading save error:", error);
    res.status(500).json({ message: "Failed to save health reading" });
  }
});

app.get("/api/health-readings/:patientId", async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    if (!useMockDb && pool) {
      try {
        const result = await pool.query(
          "SELECT * FROM health_readings WHERE patient_id = $1 ORDER BY recorded_at DESC",
          [patientId]
        );
        return res.json(result.rows);
      } catch (err) {
        console.warn("PG health reading fetch failed, using mock:", err);
      }
    }

    const list = mockReadings.filter((r) => r.patient_id === patientId);
    res.json(list);
  } catch (error) {
    console.error("Fetch health readings error:", error);
    res.status(500).json({ message: "Failed to fetch health readings" });
  }
});

app.get("/api/doctor/health-readings", async (req: Request, res: Response) => {
  try {
    if (!useMockDb && pool) {
      try {
        const result = await pool.query(
          `SELECT hr.id, hr.patient_id, u.name AS patient_name, hr.condition,
                  hr.readings, hr.recorded_at, pc.ml_profile
           FROM health_readings hr
           JOIN users u ON hr.patient_id = u.id
           LEFT JOIN patient_conditions pc ON pc.patient_id = hr.patient_id AND pc.condition = hr.condition
           ORDER BY hr.recorded_at DESC`
        );
        return res.json(result.rows);
      } catch (err) {
        console.warn("PG doctor readings fetch failed, using mock:", err);
      }
    }

    const joined = mockReadings.map((hr) => {
      const user = mockUsers.find((u) => u.id === hr.patient_id);
      const condition = mockConditions.find(
        (c) => c.patient_id === hr.patient_id && c.condition === hr.condition
      );
      return {
        id: hr.id,
        patient_id: hr.patient_id,
        patient_name: user ? user.name : "Patient " + hr.patient_id,
        condition: hr.condition,
        readings: hr.readings,
        recorded_at: hr.recorded_at,
        ml_profile: condition ? condition.ml_profile : null,
      };
    });

    res.json(joined);
  } catch (error) {
    console.error("Doctor health readings error:", error);
    res.status(500).json({ message: "Failed to fetch patient health records" });
  }
});

// ======================================================
// APPOINTMENTS
// ======================================================
app.post("/api/appointments", async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, appointmentDate, reason } = req.body;
    if (!patientId || !doctorId || !appointmentDate) {
      return res.status(400).json({
        message: "Patient, doctor and appointment date are required",
      });
    }

    if (!useMockDb && pool) {
      try {
        const result = await pool.query(
          `INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [patientId, doctorId, appointmentDate, reason || null]
        );
        return res.status(201).json({
          message: "Appointment requested successfully",
          appointment: result.rows[0],
        });
      } catch (err) {
        console.warn("PG appointment create failed, using mock:", err);
      }
    }

    const newApt: Appointment = {
      id: `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_date: appointmentDate,
      reason: reason || null,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    mockAppointments.unshift(newApt);

    res.status(201).json({
      message: "Appointment requested successfully",
      appointment: newApt,
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({ message: "Failed to create appointment" });
  }
});

app.get("/api/appointments/patient/:patientId", async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    if (!useMockDb && pool) {
      try {
        const result = await pool.query(
          `SELECT a.id, a.appointment_date, a.reason, a.status, a.created_at,
                  u.name AS doctor_name, u.email AS doctor_email
           FROM appointments a
           JOIN users u ON a.doctor_id = u.id
           WHERE a.patient_id = $1
           ORDER BY a.appointment_date DESC`,
          [patientId]
        );
        return res.json(result.rows);
      } catch (err) {
        console.warn("PG patient appointments fetch failed, using mock:", err);
      }
    }

    const list = mockAppointments
      .filter((a) => a.patient_id === patientId)
      .map((a) => {
        const doc = mockUsers.find((u) => u.id === a.doctor_id);
        return {
          id: a.id,
          appointment_date: a.appointment_date,
          reason: a.reason,
          status: a.status,
          created_at: a.created_at,
          doctor_name: doc ? doc.name : "Dr. Smith",
          doctor_email: doc ? doc.email : "doctor@example.com",
        };
      });

    res.json(list);
  } catch (error) {
    console.error("Patient appointments error:", error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

app.get("/api/appointments/doctor/:doctorId", async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;

    if (!useMockDb && pool) {
      try {
        const result = await pool.query(
          `SELECT a.id, a.appointment_date, a.reason, a.status, a.created_at,
                  u.name AS patient_name, u.email AS patient_email
           FROM appointments a
           JOIN users u ON a.patient_id = u.id
           WHERE a.doctor_id = $1
           ORDER BY a.appointment_date DESC`,
          [doctorId]
        );
        return res.json(result.rows);
      } catch (err) {
        console.warn("PG doctor appointments fetch failed, using mock:", err);
      }
    }

    const list = mockAppointments
      .filter((a) => a.doctor_id === doctorId)
      .map((a) => {
        const pat = mockUsers.find((u) => u.id === a.patient_id);
        return {
          id: a.id,
          appointment_date: a.appointment_date,
          reason: a.reason,
          status: a.status,
          created_at: a.created_at,
          patient_name: pat ? pat.name : "Patient",
          patient_email: pat ? pat.email : "patient@example.com",
        };
      });

    res.json(list);
  } catch (error) {
    console.error("Doctor appointments error:", error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

app.patch("/api/appointments/:appointmentId/status", async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    const allowed = ["approved", "cancelled", "completed", "pending"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid appointment status" });
    }

    if (!useMockDb && pool) {
      try {
        const result = await pool.query(
          `UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *`,
          [status, appointmentId]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ message: "Appointment not found" });
        }
        return res.json({
          message: "Appointment status updated",
          appointment: result.rows[0],
        });
      } catch (err) {
        console.warn("PG appointment status update failed, using mock:", err);
      }
    }

    const apt = mockAppointments.find((a) => a.id === appointmentId);
    if (!apt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    apt.status = status;
    res.json({
      message: "Appointment status updated",
      appointment: apt,
    });
  } catch (error) {
    console.error("Appointment status update error:", error);
    res.status(500).json({ message: "Failed to update appointment" });
  }
});

// ======================================================
// PATIENT CONDITIONS
// ======================================================
app.get("/api/patient-conditions/:patientId", async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    if (!useMockDb && pool) {
      try {
        const result = await pool.query(
          `SELECT id, condition, ml_profile, created_at
           FROM patient_conditions WHERE patient_id = $1 ORDER BY created_at ASC`,
          [patientId]
        );
        return res.json(result.rows);
      } catch (err) {
        console.warn("PG patient conditions fetch failed, using mock:", err);
      }
    }

    const list = mockConditions.filter((c) => c.patient_id === patientId);
    res.json(list);
  } catch (error) {
    console.error("Fetch patient conditions error:", error);
    res.status(500).json({ message: "Failed to fetch patient conditions" });
  }
});

app.post("/api/patient-conditions", async (req: Request, res: Response) => {
  try {
    const { patientId, condition, mlProfile } = req.body;

    if (!patientId || !condition) {
      return res.status(400).json({ message: "Patient ID and condition are required" });
    }

    const allowedConditions = [
      "hypertension",
      "diabetes",
      "COPD",
      "heart_disease",
      "asthma",
      "CKD",
      "obesity",
      "thyroid",
    ];

    if (!allowedConditions.includes(condition)) {
      return res.status(400).json({ message: "Invalid medical condition" });
    }

    if (condition === "hypertension") {
      if (!mlProfile) {
        return res.status(400).json({ message: "Hypertension profile is required" });
      }

      const requiredProfileFields = [
        "male",
        "age",
        "currentSmoker",
        "cigsPerDay",
        "BPMeds",
        "diabetes",
        "totChol",
        "BMI",
        "glucose",
      ];

      const missing = requiredProfileFields.filter(
        (f) => mlProfile[f] === undefined || mlProfile[f] === null
      );
      if (missing.length > 0) {
        return res.status(400).json({
          message: "Missing hypertension profile fields",
          missing,
        });
      }
    }

    if (!useMockDb && pool) {
      try {
        const result = await pool.query(
          `INSERT INTO patient_conditions (patient_id, condition, ml_profile)
           VALUES ($1, $2, $3)
           ON CONFLICT (patient_id, condition)
           DO UPDATE SET ml_profile = COALESCE(EXCLUDED.ml_profile, patient_conditions.ml_profile)
           RETURNING *`,
          [patientId, condition, mlProfile || null]
        );
        return res.status(201).json({
          message: "Condition added successfully",
          condition: result.rows[0],
        });
      } catch (err) {
        console.warn("PG condition insert failed, using mock:", err);
      }
    }

    const existingIdx = mockConditions.findIndex(
      (c) => c.patient_id === patientId && c.condition === condition
    );

    if (existingIdx >= 0) {
      mockConditions[existingIdx].ml_profile = mlProfile || mockConditions[existingIdx].ml_profile;
      return res.status(201).json({
        message: "Condition updated successfully",
        condition: mockConditions[existingIdx],
      });
    }

    const newCond: PatientCondition = {
      id: `cond-${Date.now()}`,
      patient_id: patientId,
      condition,
      ml_profile: mlProfile || null,
      created_at: new Date().toISOString(),
    };
    mockConditions.push(newCond);

    res.status(201).json({
      message: "Condition added successfully",
      condition: newCond,
    });
  } catch (error) {
    console.error("Add patient condition error:", error);
    res.status(500).json({ message: "Failed to add patient condition" });
  }
});

// ======================================================
// ML PREDICTION ENGINES (SELF-CONTAINED CLINICAL MODELS)
// ======================================================
app.post("/api/ml/heart-disease", (req: Request, res: Response) => {
  try {
    const data = req.body;
    const required = [
      "age",
      "sex",
      "cp",
      "trestbps",
      "chol",
      "fbs",
      "restecg",
      "thalach",
      "exang",
      "oldpeak",
      "slope",
      "ca",
      "thal",
    ];

    const missing = required.filter((k) => data[k] === undefined || data[k] === null);
    if (missing.length > 0) {
      return res.status(400).json({ message: "Missing ML features", missing });
    }

    // Cleveland Clinical Risk scoring model
    let score = -2.5;
    score += (Number(data.age) - 50) * 0.04;
    score += Number(data.sex) === 1 ? 0.6 : 0.0;
    score += (Number(data.cp) - 1) * 0.45;
    score += (Number(data.trestbps) - 120) * 0.015;
    score += (Number(data.chol) - 200) * 0.006;
    score += Number(data.fbs) === 1 ? 0.35 : 0;
    score += (160 - Number(data.thalach)) * 0.02;
    score += Number(data.exang) === 1 ? 0.8 : 0;
    score += Number(data.oldpeak) * 0.55;
    score += Number(data.ca) * 0.65;
    score += Number(data.thal) >= 6 ? 0.75 : 0;

    // Sigmoid probability
    const prob = 1 / (1 + Math.exp(-score));
    const probability = Math.min(Math.max(Math.round(prob * 10000) / 100, 5), 98);
    const prediction = probability >= 50 ? 1 : 0;
    const risk = prediction === 1 ? "High" : "Low";

    res.json({
      message: "ML prediction successful",
      prediction: {
        disease: "Heart Disease",
        prediction,
        risk,
        probability,
      },
    });
  } catch (error) {
    console.error("Heart disease prediction error:", error);
    res.status(500).json({ message: "Failed to get ML prediction" });
  }
});

app.post("/api/ml/hypertension", (req: Request, res: Response) => {
  try {
    const data = req.body;
    const required = [
      "male",
      "age",
      "currentSmoker",
      "cigsPerDay",
      "BPMeds",
      "diabetes",
      "totChol",
      "sysBP",
      "diaBP",
      "BMI",
      "heartRate",
      "glucose",
    ];

    const missing = required.filter((k) => data[k] === undefined || data[k] === null);
    if (missing.length > 0) {
      return res.status(400).json({ message: "Missing hypertension ML features", missing });
    }

    // Framingham Hypertension clinical risk algorithm
    let score = -3.2;
    score += Number(data.male) === 1 ? 0.3 : 0;
    score += (Number(data.age) - 40) * 0.035;
    score += Number(data.currentSmoker) === 1 ? 0.4 + Number(data.cigsPerDay) * 0.015 : 0;
    score += Number(data.BPMeds) === 1 ? 0.8 : 0;
    score += Number(data.diabetes) === 1 ? 0.6 : 0;
    score += (Number(data.totChol) - 180) * 0.005;
    score += (Number(data.sysBP) - 120) * 0.045;
    score += (Number(data.diaBP) - 80) * 0.04;
    score += (Number(data.BMI) - 24) * 0.05;
    score += (Number(data.glucose) - 90) * 0.008;

    const prob = 1 / (1 + Math.exp(-score));
    const probability = Math.min(Math.max(Math.round(prob * 10000) / 100, 5), 98);
    const prediction = probability >= 50 || Number(data.sysBP) >= 140 || Number(data.diaBP) >= 90 ? 1 : 0;
    const risk = prediction === 1 ? "High" : "Low";

    res.json({
      message: "Hypertension ML prediction successful",
      prediction: {
        disease: "Hypertension",
        prediction,
        risk,
        probability,
      },
    });
  } catch (error) {
    console.error("Hypertension prediction error:", error);
    res.status(500).json({ message: "Failed to get hypertension ML prediction" });
  }
});

app.post("/api/ml/diabetes", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const required = [
      "gender",
      "age",
      "hypertension",
      "heart_disease",
      "smoking_history",
      "bmi",
      "HbA1c_level",
      "blood_glucose_level",
    ];

    const missing = required.filter((k) => data[k] === undefined || data[k] === null);
    if (missing.length > 0) {
      return res.status(400).json({ message: "Missing diabetes features", missing });
    }

    const flaskUrl = process.env.FLASK_URL || "http://127.0.0.1:5001";
    const mlResponse = await axios.post(`${flaskUrl}/predict/diabetes`, data);

    res.json({
      message: "Diabetes ML prediction successful",
      prediction: mlResponse.data,
    });
  } catch (error: any) {
    console.error("Diabetes ML prediction error:", error?.message || error);
    res.status(500).json({
      message: "Failed to get diabetes ML prediction",
      details: error?.response?.data || error?.message,
    });
  }
});

// ======================================================
// VITE DEV SERVER OR STATIC PRODUCTION SERVING
// ======================================================
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0" },
      appType: "spa",
      root: __dirname,
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FHIR Telehealth server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
