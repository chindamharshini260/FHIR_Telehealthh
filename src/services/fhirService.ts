// ============================================================
// BLOOD PRESSURE - HYPERTENSION
// ============================================================

export function createBloodPressureObservation(
  patientId: string,
  systolic: number,
  diastolic: number
) {
  return {
    resourceType: "Observation",

    id: `bp-${Date.now()}`,

    status: "final",

    subject: {
      reference: `Patient/${patientId}`,
    },

    category: [
      {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs",
            display: "Vital Signs",
          },
        ],
      },
    ],

    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "85354-9",
          display: "Blood pressure panel",
        },
      ],
      text: "Blood Pressure",
    },

    effectiveDateTime: new Date().toISOString(),

    component: [
      {
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "8480-6",
              display: "Systolic blood pressure",
            },
          ],
        },

        valueQuantity: {
          value: systolic,
          unit: "mmHg",
          system: "http://unitsofmeasure.org",
          code: "mm[Hg]",
        },
      },

      {
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "8462-4",
              display: "Diastolic blood pressure",
            },
          ],
        },

        valueQuantity: {
          value: diastolic,
          unit: "mmHg",
          system: "http://unitsofmeasure.org",
          code: "mm[Hg]",
        },
      },
    ],
  };
}


// ============================================================
// GLUCOSE - DIABETES
// ============================================================

export function createGlucoseObservation(
  patientId: string,
  glucose: number
) {
  return {
    resourceType: "Observation",

    id: `glucose-${Date.now()}`,

    status: "final",

    subject: {
      reference: `Patient/${patientId}`,
    },

    category: [
      {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "laboratory",
            display: "Laboratory",
          },
        ],
      },
    ],

    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "2339-0",
          display: "Glucose",
        },
      ],
      text: "Blood Glucose",
    },

    effectiveDateTime: new Date().toISOString(),

    valueQuantity: {
      value: glucose,
      unit: "mg/dL",
      system: "http://unitsofmeasure.org",
      code: "mg/dL",
    },
  };
}


// ============================================================
// COPD
// ============================================================

export function createCOPDObservations(
  patientId: string,
  spo2: number,
  respiratoryRate: number,
  heartRate: number
) {
  return {
    resourceType: "Bundle",

    type: "collection",

    entry: [
      {
        resource: {
          resourceType: "Observation",

          id: `spo2-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "59408-5",
                display: "Oxygen saturation",
              },
            ],
            text: "SpO2",
          },

          valueQuantity: {
            value: spo2,
            unit: "%",
            system: "http://unitsofmeasure.org",
            code: "%",
          },

          effectiveDateTime:
            new Date().toISOString(),
        },
      },

      {
        resource: {
          resourceType: "Observation",

          id: `resp-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "9279-1",
                display: "Respiratory rate",
              },
            ],
            text: "Respiratory Rate",
          },

          valueQuantity: {
            value: respiratoryRate,
            unit: "breaths/min",
            system: "http://unitsofmeasure.org",
            code: "/min",
          },

          effectiveDateTime:
            new Date().toISOString(),
        },
      },

      {
        resource: {
          resourceType: "Observation",

          id: `hr-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8867-4",
                display: "Heart rate",
              },
            ],
            text: "Heart Rate",
          },

          valueQuantity: {
            value: heartRate,
            unit: "BPM",
            system: "http://unitsofmeasure.org",
            code: "/min",
          },

          effectiveDateTime:
            new Date().toISOString(),
        },
      },
    ],
  };
}


// ============================================================
// HEART DISEASE
// BP + HEART RATE + SpO2
// ============================================================

export function createHeartDiseaseObservations(
  patientId: string,
  systolic: number,
  diastolic: number,
  heartRate: number,
  spo2: number
) {
  return {
    resourceType: "Bundle",

    type: "collection",

    entry: [
      {
        resource: createBloodPressureObservation(
          patientId,
          systolic,
          diastolic
        ),
      },

      {
        resource: {
          resourceType: "Observation",

          id: `heart-rate-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8867-4",
                display: "Heart rate",
              },
            ],
            text: "Heart Rate",
          },

          effectiveDateTime:
            new Date().toISOString(),

          valueQuantity: {
            value: heartRate,
            unit: "BPM",
            system: "http://unitsofmeasure.org",
            code: "/min",
          },
        },
      },

      {
        resource: {
          resourceType: "Observation",

          id: `heart-spo2-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "59408-5",
                display: "Oxygen saturation",
              },
            ],
            text: "SpO2",
          },

          effectiveDateTime:
            new Date().toISOString(),

          valueQuantity: {
            value: spo2,
            unit: "%",
            system: "http://unitsofmeasure.org",
            code: "%",
          },
        },
      },
    ],
  };
}


// ============================================================
// ASTHMA
// SpO2 + RESPIRATORY RATE + PEAK FLOW
// ============================================================

export function createAsthmaObservations(
  patientId: string,
  spo2: number,
  respiratoryRate: number,
  peakFlow: number
) {
  return {
    resourceType: "Bundle",

    type: "collection",

    entry: [
      {
        resource: {
          resourceType: "Observation",

          id: `asthma-spo2-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "59408-5",
                display: "Oxygen saturation",
              },
            ],
            text: "SpO2",
          },

          effectiveDateTime:
            new Date().toISOString(),

          valueQuantity: {
            value: spo2,
            unit: "%",
            system: "http://unitsofmeasure.org",
            code: "%",
          },
        },
      },

      {
        resource: {
          resourceType: "Observation",

          id: `asthma-resp-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "9279-1",
                display: "Respiratory rate",
              },
            ],
            text: "Respiratory Rate",
          },

          effectiveDateTime:
            new Date().toISOString(),

          valueQuantity: {
            value: respiratoryRate,
            unit: "breaths/min",
            system: "http://unitsofmeasure.org",
            code: "/min",
          },
        },
      },

      {
        resource: {
          resourceType: "Observation",

          id: `peak-flow-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "19911-7",
                display: "Peak expiratory flow rate",
              },
            ],
            text: "Peak Flow",
          },

          effectiveDateTime:
            new Date().toISOString(),

          valueQuantity: {
            value: peakFlow,
            unit: "L/min",
            system: "http://unitsofmeasure.org",
            code: "L/min",
          },
        },
      },
    ],
  };
}


// ============================================================
// CHRONIC KIDNEY DISEASE
// CREATININE + eGFR + SYSTOLIC BP
// ============================================================

export function createCKDObservations(
  patientId: string,
  creatinine: number,
  egfr: number,
  systolic: number
) {
  return {
    resourceType: "Bundle",

    type: "collection",

    entry: [
      {
        resource: {
          resourceType: "Observation",

          id: `creatinine-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "2160-0",
                display: "Creatinine",
              },
            ],
            text: "Serum Creatinine",
          },

          effectiveDateTime:
            new Date().toISOString(),

          valueQuantity: {
            value: creatinine,
            unit: "mg/dL",
            system: "http://unitsofmeasure.org",
            code: "mg/dL",
          },
        },
      },

      {
        resource: {
          resourceType: "Observation",

          id: `egfr-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "62238-1",
                display:
                  "Glomerular filtration rate",
              },
            ],
            text: "eGFR",
          },

          effectiveDateTime:
            new Date().toISOString(),

          valueQuantity: {
            value: egfr,
            unit: "mL/min/1.73 m2",
            system: "http://unitsofmeasure.org",
            code: "mL/min/{1.73_m2}",
          },
        },
      },

      {
        resource: {
          resourceType: "Observation",

          id: `ckd-bp-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8480-6",
                display:
                  "Systolic blood pressure",
              },
            ],
            text: "Systolic Blood Pressure",
          },

          effectiveDateTime:
            new Date().toISOString(),

          valueQuantity: {
            value: systolic,
            unit: "mmHg",
            system: "http://unitsofmeasure.org",
            code: "mm[Hg]",
          },
        },
      },
    ],
  };
}


// ============================================================
// OBESITY
// WEIGHT + HEIGHT + BMI
// ============================================================

export function createObesityObservations(
  patientId: string,
  weight: number,
  height: number,
  bmi: number
) {
  return {
    resourceType: "Bundle",

    type: "collection",

    entry: [
      {
        resource: {
          resourceType: "Observation",

          id: `weight-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "29463-7",
                display: "Body weight",
              },
            ],
            text: "Weight",
          },

          effectiveDateTime:
            new Date().toISOString(),

          valueQuantity: {
            value: weight,
            unit: "kg",
            system: "http://unitsofmeasure.org",
            code: "kg",
          },
        },
      },

      {
        resource: {
          resourceType: "Observation",

          id: `height-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8302-2",
                display: "Body height",
              },
            ],
            text: "Height",
          },

          effectiveDateTime:
            new Date().toISOString(),

          valueQuantity: {
            value: height,
            unit: "cm",
            system: "http://unitsofmeasure.org",
            code: "cm",
          },
        },
      },

      {
        resource: {
          resourceType: "Observation",

          id: `bmi-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "39156-5",
                display:
                  "Body mass index (BMI)",
              },
            ],
            text: "BMI",
          },

          effectiveDateTime:
            new Date().toISOString(),

          valueQuantity: {
            value: bmi,
            unit: "kg/m2",
            system: "http://unitsofmeasure.org",
            code: "kg/m2",
          },
        },
      },
    ],
  };
}


// ============================================================
// THYROID
// TSH + T3 + T4
// ============================================================

export function createThyroidObservations(
  patientId: string,
  tsh: number,
  t3: number,
  t4: number
) {
  return {
    resourceType: "Bundle",

    type: "collection",

    entry: [
      {
        resource: {
          resourceType: "Observation",

          id: `tsh-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "3016-3",
                display:
                  "Thyrotropin (TSH)",
              },
            ],
            text: "TSH",
          },

          effectiveDateTime:
            new Date().toISOString(),

          valueQuantity: {
            value: tsh,
            unit: "mIU/L",
            system: "http://unitsofmeasure.org",
            code: "m[IU]/L",
          },
        },
      },

      {
        resource: {
          resourceType: "Observation",

          id: `t3-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "3053-6",
                display: "Triiodothyronine T3",
              },
            ],
            text: "T3",
          },

          effectiveDateTime:
            new Date().toISOString(),

          valueQuantity: {
            value: t3,
            unit: "ng/dL",
            system: "http://unitsofmeasure.org",
            code: "ng/dL",
          },
        },
      },

      {
        resource: {
          resourceType: "Observation",

          id: `t4-${Date.now()}`,

          status: "final",

          subject: {
            reference: `Patient/${patientId}`,
          },

          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "3024-7",
                display:
                  "Thyroxine (T4)",
              },
            ],
            text: "T4",
          },

          effectiveDateTime:
            new Date().toISOString(),

          valueQuantity: {
            value: t4,
            unit: "µg/dL",
            system: "http://unitsofmeasure.org",
            code: "ug/dL",
          },
        },
      },
    ],
  };
}


// ============================================================
// FHIR CONDITION RESOURCE
// ============================================================

export function createConditionResource(
  patientId: string,
  condition: string
) {
  const conditionMap: Record<
    string,
    {
      code: string;
      display: string;
    }
  > = {
    hypertension: {
      code: "38341003",
      display: "Hypertensive disorder",
    },

    diabetes: {
      code: "73211009",
      display: "Diabetes mellitus",
    },

    COPD: {
      code: "13645005",
      display:
        "Chronic obstructive lung disease",
    },

    heart_disease: {
      code: "56265001",
      display: "Heart disease",
    },

    asthma: {
      code: "195967001",
      display: "Asthma",
    },

    CKD: {
      code: "709044004",
      display:
        "Chronic kidney disease",
    },

    obesity: {
      code: "414916001",
      display: "Obesity",
    },

    thyroid: {
      code: "14304000",
      display:
        "Disorder of thyroid",
    },
  };

  const selected =
    conditionMap[condition];

  if (!selected) {
    throw new Error(
      "Unsupported medical condition"
    );
  }

  return {
    resourceType: "Condition",

    id: `condition-${Date.now()}`,

    clinicalStatus: {
      coding: [
        {
          system:
            "http://terminology.hl7.org/CodeSystem/condition-clinical",

          code: "active",

          display: "Active",
        },
      ],
    },

    verificationStatus: {
      coding: [
        {
          system:
            "http://terminology.hl7.org/CodeSystem/condition-ver-status",

          code: "confirmed",

          display: "Confirmed",
        },
      ],
    },

    code: {
      coding: [
        {
          system:
            "http://snomed.info/sct",

          code: selected.code,

          display: selected.display,
        },
      ],

      text: selected.display,
    },

    subject: {
      reference: `Patient/${patientId}`,
    },

    recordedDate:
      new Date().toISOString(),
  };
}