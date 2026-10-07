import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)


# --------------------------------------------------
# 1. Dataset path
# --------------------------------------------------

DATA_PATH = "data/processed.cleveland.data"


# --------------------------------------------------
# 2. Column names from UCI Heart Disease dataset
# --------------------------------------------------

columns = [
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
    "target",
]


# --------------------------------------------------
# 3. Load real dataset
# --------------------------------------------------

df = pd.read_csv(
    DATA_PATH,
    names=columns,
    na_values="?"
)

print("\nDataset loaded successfully")
print("Shape:", df.shape)

print("\nFirst 5 rows:")
print(df.head())


# --------------------------------------------------
# 4. Convert columns to numeric
# --------------------------------------------------

for column in columns:
    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )


# --------------------------------------------------
# 5. Show missing values
# --------------------------------------------------

print("\nMissing values:")
print(df.isnull().sum())


# --------------------------------------------------
# 6. Convert target to binary
#
# Original:
# 0 = no heart disease
# 1,2,3,4 = heart disease
# --------------------------------------------------

df["target"] = (df["target"] > 0).astype(int)


# --------------------------------------------------
# 7. Separate features and target
# --------------------------------------------------

X = df.drop("target", axis=1)
y = df["target"]


print("\nFeatures:")
print(X.columns.tolist())

print("\nTarget distribution:")
print(y.value_counts())


# --------------------------------------------------
# 8. Train/Test split
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# --------------------------------------------------
# 9. Build ML pipeline
# --------------------------------------------------

model = Pipeline([
    (
        "imputer",
        SimpleImputer(strategy="median")
    ),

    (
        "scaler",
        StandardScaler()
    ),

    (
        "classifier",
        LogisticRegression(
            max_iter=1000,
            random_state=42
        )
    )
])


# --------------------------------------------------
# 10. Train model
# --------------------------------------------------

print("\nTraining model...")

model.fit(
    X_train,
    y_train
)

print("Training completed!")


# --------------------------------------------------
# 11. Make predictions
# --------------------------------------------------

y_pred = model.predict(X_test)


# --------------------------------------------------
# 12. Evaluate model
# --------------------------------------------------

accuracy = accuracy_score(
    y_test,
    y_pred
)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)


print("\n================================")
print("MODEL PERFORMANCE")
print("================================")

print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")


# --------------------------------------------------
# 13. Confusion matrix
# --------------------------------------------------

print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        y_pred
    )
)


# --------------------------------------------------
# 14. Classification report
# --------------------------------------------------

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        y_pred,
        target_names=[
            "No Heart Disease",
            "Heart Disease"
        ],
        zero_division=0
    )
)


# --------------------------------------------------
# 15. Save trained model
# --------------------------------------------------

MODEL_PATH = "heart_disease_model.joblib"

joblib.dump(
    model,
    MODEL_PATH
)

print("\n================================")
print("MODEL SAVED")
print("================================")

print(
    f"Saved to: {MODEL_PATH}"
)