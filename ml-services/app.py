from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

# ==============================
# LOAD ML MODELS
# ==============================

heart_model = joblib.load("heart_disease_model.joblib")
hypertension_model = joblib.load("hypertension_model.joblib")


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
# START SERVER
# ==============================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True
    )