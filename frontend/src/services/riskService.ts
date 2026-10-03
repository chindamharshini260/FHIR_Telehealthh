export type RiskResult = {
  level: "Low" | "Moderate" | "High" | "Insufficient Data";
  message: string;
};

export function calculateRisk(
  condition: string,
  readings: Record<string, string>
): RiskResult {
  if (condition === "hypertension") {
    const systolic = Number(readings.systolic);
    const diastolic = Number(readings.diastolic);

    if (!readings.systolic || !readings.diastolic) {
      return {
        level: "Insufficient Data",
        message:
          "Systolic and diastolic blood pressure are required.",
      };
    }

    if (systolic >= 140 || diastolic >= 90) {
      return {
        level: "High",
        message:
          "Blood pressure is elevated and requires doctor review.",
      };
    }

    if (systolic >= 130 || diastolic >= 80) {
      return {
        level: "Moderate",
        message:
          "Blood pressure is above the expected range.",
      };
    }

    return {
      level: "Low",
      message:
        "Blood pressure is within the expected range.",
    };
  }

  if (condition === "diabetes") {
    const glucose = Number(readings.glucose);

    if (!readings.glucose) {
      return {
        level: "Insufficient Data",
        message:
          "Blood glucose reading is required.",
      };
    }

    if (glucose >= 200) {
      return {
        level: "High",
        message:
          "Blood glucose is significantly elevated and requires doctor review.",
      };
    }

    if (glucose >= 140) {
      return {
        level: "Moderate",
        message:
          "Blood glucose is elevated.",
      };
    }

    return {
      level: "Low",
      message:
        "Blood glucose is within the expected range.",
    };
  }

  if (condition === "copd") {
    const spo2 = Number(readings.spo2);
    const respiratoryRate = Number(
      readings.respiratoryRate
    );

    if (!readings.spo2 || !readings.respiratoryRate) {
      return {
        level: "Insufficient Data",
        message:
          "SpO₂ and respiratory rate are required.",
      };
    }

    if (spo2 < 92 || respiratoryRate > 24) {
      return {
        level: "High",
        message:
          "Respiratory readings require doctor review.",
      };
    }

    if (spo2 < 95 || respiratoryRate > 20) {
      return {
        level: "Moderate",
        message:
          "Respiratory readings are outside the expected range.",
      };
    }

    return {
      level: "Low",
      message:
        "Respiratory readings are within the expected range.",
    };
  }

  return {
    level: "Insufficient Data",
    message:
      "Insufficient data for risk assessment.",
  };
}