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
          effectiveDateTime: new Date().toISOString(),
        },
      },
      {
        resource: {
          resourceType: "Observation",
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
          effectiveDateTime: new Date().toISOString(),
        },
      },
      {
        resource: {
          resourceType: "Observation",
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
          effectiveDateTime: new Date().toISOString(),
        },
      },
    ],
  };
}
export function createConditionResource(
  patientId: string,
  condition: string
) {
  const conditionMap: Record<string, {
    code: string;
    display: string;
  }> = {
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
      display: "Chronic obstructive lung disease",
    },
  };

  const selected = conditionMap[condition];

  if (!selected) {
    throw new Error("Unsupported medical condition");
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
          system: "http://snomed.info/sct",
          code: selected.code,
          display: selected.display,
        },
      ],
      text: selected.display,
    },
    subject: {
      reference: `Patient/${patientId}`,
    },
    recordedDate: new Date().toISOString(),
  };
}