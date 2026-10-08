from flask import Flask, request, jsonify
import joblib
import pandas as pd
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ==============================
# LOAD ML MODELS
# ==============================

heart_model = joblib.load(os.path.join(BASE_DIR, "heart_disease_model.joblib"))
hypertension_model = joblib.load(os.path.join(BASE_DIR, "hypertension_model.joblib"))
diabetes_model = joblib.load(os.path.join(BASE_DIR, "diabetes_model.joblib"))


# ==============================
# HEART DISEASE FEATURES
# ==============================

HEART_FEATURES = [
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
]


# ==============================
# HYPERTENSION FEATURES
# ==============================

HYPERTENSION_FEATURES = [
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
]


# ==============================
# DIABETES FEATURES
# ==============================

DIABETES_FEATURES = [
    "gender",
    "age",
    "hypertension",
    "heart_disease",
    "smoking_history",
    "bmi",
    "HbA1c_level",
    "blood_glucose_level",
]


# ==============================
# HEALTH CHECK
# ==============================

@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ML service is running"
    })


# ==============================
# HEART DISEASE PREDICTION
# ==============================

@app.route("/predict/heart-disease", methods=["POST"])
def predict_heart_disease():

    try:

        data = request.get_json()

        missing_features = [
            feature
            for feature in HEART_FEATURES
            if feature not in data
        ]

        if missing_features:

            return jsonify({
                "error": "Missing features",
                "missing": missing_features
            }), 400

        input_data = pd.DataFrame(
            [[data[feature] for feature in HEART_FEATURES]],
            columns=HEART_FEATURES
        )

        prediction = heart_model.predict(input_data)[0]

        probability = heart_model.predict_proba(
            input_data
        )[0][1]

        risk = "High" if prediction == 1 else "Low"

        return jsonify({

            "disease": "Heart Disease",

            "prediction": int(prediction),

            "risk": risk,

            "probability": round(
                float(probability) * 100,
                2
            )

        })

    except Exception as error:

        print("Heart disease prediction error:", error)

        return jsonify({
            "error": "Heart disease prediction failed"
        }), 500


# ==============================
# HYPERTENSION PREDICTION
# ==============================

@app.route("/predict/hypertension", methods=["POST"])
def predict_hypertension():

    try:

        data = request.get_json()

        missing_features = [
            feature
            for feature in HYPERTENSION_FEATURES
            if feature not in data
        ]

        if missing_features:

            return jsonify({
                "error": "Missing features",
                "missing": missing_features
            }), 400

        input_data = pd.DataFrame(
            [[data[feature] for feature in HYPERTENSION_FEATURES]],
            columns=HYPERTENSION_FEATURES
        )

        prediction = hypertension_model.predict(
            input_data
        )[0]

        probability = hypertension_model.predict_proba(
            input_data
        )[0][1]

        risk = "High" if prediction == 1 else "Low"

        return jsonify({

            "disease": "Hypertension",

            "prediction": int(prediction),

            "risk": risk,

            "probability": round(
                float(probability) * 100,
                2
            )

        })

    except Exception as error:

        print("Hypertension prediction error:", error)

        return jsonify({
            "error": "Hypertension prediction failed"
        }), 500


# ==============================
# DIABETES PREDICTION
# ==============================

@app.route("/predict/diabetes", methods=["POST"])
def predict_diabetes():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON payload provided"}), 400

        missing_features = [
            feature
            for feature in DIABETES_FEATURES
            if feature not in data or data[feature] is None
        ]

        if missing_features:
            return jsonify({
                "error": "Missing features",
                "missing": missing_features
            }), 400

        # Construct single-row DataFrame
        row_dict = {
            "gender": str(data["gender"]),
            "age": float(data["age"]),
            "hypertension": int(data["hypertension"]),
            "heart_disease": int(data["heart_disease"]),
            "smoking_history": str(data["smoking_history"]),
            "bmi": float(data["bmi"]),
            "HbA1c_level": float(data["HbA1c_level"]),
            "blood_glucose_level": float(data["blood_glucose_level"]),
        }
        input_data = pd.DataFrame([row_dict])

        prediction = int(diabetes_model.predict(input_data)[0])
        prob_val = float(diabetes_model.predict_proba(input_data)[0][1])
        probability = round(prob_val * 100, 1)

        # Clinically calibrated risk stratification thresholds:
        # < 30%: Low Risk (Normal glycemic range)
        # 30% - 59.9%: Moderate Risk (Borderline / Impaired metabolic indicators)
        # >= 60%: High Risk (Elevated glucose / HbA1c indicative of diabetes)
        if probability >= 60.0:
            risk = "High"
            message = "Elevated glycemic levels and metabolic risk factors indicate high risk for diabetes. Diagnostic evaluation recommended."
        elif probability >= 30.0:
            risk = "Moderate"
            message = "Borderline metabolic indicators detected. Recommend lifestyle modification and periodic glucose monitoring."
        else:
            risk = "Low"
            message = "Metabolic and glycemic indicators are within normal expected risk range."

        return jsonify({
            "disease": "diabetes",
            "prediction": prediction,
            "probability": probability,
            "risk": risk,
            "message": message,
            "disclaimer": "AI-generated risk assessment for clinical decision support only. Final clinical decisions must be made by a qualified healthcare professional."
        })

    except Exception as error:
        print("Diabetes prediction error:", error)
        return jsonify({
            "error": "Diabetes prediction failed",
            "details": str(error)
        }), 500


# ==============================
# START SERVER
# ==============================

if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5001))
    print(f"Starting Flask ML service on port {port}...")
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )