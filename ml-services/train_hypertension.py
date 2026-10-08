import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

import os

# ==============================
# 1. Load dataset
# ==============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "hypertension.csv")
MODEL_PATH = os.path.join(BASE_DIR, "hypertension_model.joblib")

data = pd.read_csv(DATA_PATH)

print("Dataset shape:", data.shape)
print("\nColumns:")
print(data.columns.tolist())


# ==============================
# 2. Features and target
# ==============================

FEATURES = [
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
    "glucose"
]

TARGET = "Risk"


# ==============================
# 3. Clean data
# ==============================

data = data[FEATURES + [TARGET]].copy()

print("\nMissing values:")
print(data.isnull().sum())

# Fill numeric missing values with median
for column in FEATURES:
    data[column] = data[column].fillna(data[column].median())


# ==============================
# 4. Prepare X and y
# ==============================

X = data[FEATURES]
y = data[TARGET]

print("\nTarget distribution:")
print(y.value_counts())


# ==============================
# 5. Train/Test split
# ==============================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# ==============================
# 6. Train model
# ==============================

print("\nTraining Hypertension ML model...")

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)

model.fit(X_train, y_train)

print("Training completed!")


# ==============================
# 7. Evaluate
# ==============================

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, zero_division=0)
recall = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)

print("\n================================")
print("HYPERTENSION MODEL PERFORMANCE")
print("================================")

print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(
    y_test,
    y_pred,
    target_names=["Low Risk", "High Risk"],
    zero_division=0
))


# ==============================
# 8. Save model
# ==============================

joblib.dump(model, MODEL_PATH)

print("\n================================")
print("MODEL SAVED")
print("================================")
print(f"Saved to: {MODEL_PATH}")