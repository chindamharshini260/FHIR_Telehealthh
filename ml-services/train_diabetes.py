import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)

import os

# ==============================================================
# 1. LOAD DATASET
# ==============================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "diabetes_prediction_dataset.csv")
print(f"Loading dataset from: {DATA_PATH} ...")
df = pd.read_csv(DATA_PATH)
print("Initial shape:", df.shape)

# ==============================================================
# 2. DATA CLEANING & DEDUPLICATION
# ==============================================================
duplicate_count = df.duplicated().sum()
print(f"Duplicate rows detected: {duplicate_count}")
df = df.drop_duplicates().reset_index(drop=True)
print("Shape after removing duplicates:", df.shape)

# Handle rare gender categories ('Other' has only 18 samples)
df = df[df["gender"].isin(["Female", "Male"])].reset_index(drop=True)
print("Shape after filtering gender to Female/Male:", df.shape)

# ==============================================================
# 3. INSPECT MISSING VALUES
# ==============================================================
print("\nMissing values per column:")
print(df.isnull().sum())

# ==============================================================
# 4. IDENTIFY FEATURES & TARGET
# ==============================================================
TARGET = "diabetes"
CATEGORICAL_FEATURES = ["gender", "smoking_history"]
NUMERIC_FEATURES = [
    "age",
    "hypertension",
    "heart_disease",
    "bmi",
    "HbA1c_level",
    "blood_glucose_level",
]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES

X = df[ALL_FEATURES]
y = df[TARGET]

print(f"\nTarget distribution (Total = {len(y)}):")
print(y.value_counts())
pos_ratio = (y.sum() / len(y)) * 100
print(f"Positive diabetes prevalence: {pos_ratio:.2f}%")

# ==============================================================
# 5. TRAIN / TEST SPLIT (STRATIFIED)
# ==============================================================
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)
print(f"\nTraining set size: {len(X_train)}")
print(f"Testing set size: {len(X_test)}")

# ==============================================================
# 6. BUILD PREPROCESSING & CLASSIFIER PIPELINE
# ==============================================================
# Categorical pipeline: One-hot encode string features
# Numeric pipeline: StandardScaler for features
preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), NUMERIC_FEATURES),
        (
            "cat",
            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
            CATEGORICAL_FEATURES,
        ),
    ]
)

# Cost-sensitive classification model with class_weight='balanced'
# We use Logistic Regression for smooth, well-calibrated clinical probability outputs
model = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        (
            "classifier",
            LogisticRegression(
                class_weight="balanced",
                max_iter=1000,
                random_state=42,
                solver="lbfgs",
            ),
        ),
    ]
)

# ==============================================================
# 7. TRAIN MODEL
# ==============================================================
print("\nTraining Cost-Sensitive Diabetes Model...")
model.fit(X_train, y_train)
print("Training complete!")

# ==============================================================
# 8. EVALUATION
# ==============================================================
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, zero_division=0)
rec = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)
roc_auc = roc_auc_score(y_test, y_prob)
cm = confusion_matrix(y_test, y_pred)

print("\n" + "=" * 50)
print("DIABETES MODEL EVALUATION METRICS")
print("=" * 50)
print(f"Accuracy  : {acc:.4f}")
print(f"Precision : {prec:.4f}")
print(f"Recall    : {rec:.4f}  <-- Sensitivity prioritised for screening")
print(f"F1-Score  : {f1:.4f}")
print(f"ROC-AUC   : {roc_auc:.4f}")
print("\nConfusion Matrix:")
print(cm)
print(f"True Negatives:  {cm[0][0]}, False Positives: {cm[0][1]}")
print(f"False Negatives: {cm[1][0]}, True Positives:  {cm[1][1]}")

print("\nDetailed Classification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        target_names=["Non-Diabetic (0)", "Diabetic (1)"],
        zero_division=0,
    )
)

# ==============================================================
# 9. SAVE TRAINED MODEL
# ==============================================================
MODEL_OUTPUT_PATH = os.path.join(BASE_DIR, "diabetes_model.joblib")
joblib.dump(model, MODEL_OUTPUT_PATH)
print("=" * 50)
print(f"Model saved successfully to: {MODEL_OUTPUT_PATH}")
print("=" * 50)
