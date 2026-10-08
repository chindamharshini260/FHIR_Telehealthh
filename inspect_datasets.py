import csv
import json
import os
import math
import statistics
from collections import Counter

data_dir = "/tmp/repo/ml-services/data"

def analyze_file(filename, custom_headers=None, na_tokens=("?", "NA", "NaN", "null", "", "None")):
    filepath = os.path.join(data_dir, filename)
    print("="*75)
    print(f"ANALYSIS REPORT FOR: {filename}")
    print("="*75)
    
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        if custom_headers:
            headers = custom_headers
            rows = list(reader)
        else:
            headers = [h.strip() for h in next(reader)]
            rows = list(reader)
            
    num_rows = len(rows)
    num_cols = len(headers)
    print(f"A. Filename: {filename}")
    print(f"B. Number of rows: {num_rows}")
    print(f"C. Number of columns: {num_cols}")
    print(f"D. Exact column names: {headers}")
    
    # Check duplicates
    row_tuples = [tuple(r) for r in rows]
    duplicate_count = len(row_tuples) - len(set(row_tuples))
    print(f"H. Number of duplicate rows: {duplicate_count}")
    
    # Analyze columns
    col_data = {h: [] for h in headers}
    missing_counts = {h: 0 for h in headers}
    
    for row in rows:
        if len(row) < num_cols:
            row = row + [""] * (num_cols - len(row))
        for i, val in enumerate(row[:num_cols]):
            h = headers[i]
            v = val.strip()
            if v in na_tokens:
                missing_counts[h] += 1
                col_data[h].append(None)
            else:
                col_data[h].append(v)
                
    print("\nE, F, G. Column Types, Missing Counts, Missing Percentages:")
    col_types = {}
    for h in headers:
        m_cnt = missing_counts[h]
        m_pct = (m_cnt / num_rows) * 100 if num_rows > 0 else 0
        valid_vals = [v for v in col_data[h] if v is not None]
        
        is_num = True
        num_vals = []
        if not valid_vals:
            is_num = False
        else:
            for v in valid_vals:
                try:
                    num_vals.append(float(v))
                except ValueError:
                    is_num = False
                    break
                    
        if is_num:
            col_types[h] = "numeric"
            int_check = all(v.is_integer() for v in num_vals)
            dtype_str = "Float" if not int_check else "Integer"
            print(f"  - {h}: Type={dtype_str}, Missing={m_cnt} ({m_pct:.2f}%)")
        else:
            col_types[h] = "categorical"
            print(f"  - {h}: Type=Categorical/String, Missing={m_cnt} ({m_pct:.2f}%)")
            
    print("\nI. Categorical Columns Unique Values:")
    has_cat = False
    for h in headers:
        if col_types[h] == "categorical":
            has_cat = True
            valid_vals = [v for v in col_data[h] if v is not None]
            c = Counter(valid_vals)
            if len(c) <= 20:
                print(f"  - {h} ({len(c)} unique): {dict(c)}")
            else:
                sample_items = list(c.items())[:10]
                print(f"  - {h} ({len(c)} unique, top 10): {dict(sample_items)}")
    if not has_cat:
        print("  (None - all columns numeric)")
                
    print("\nJ. Numerical Columns Min, Max, Mean, Median:")
    for h in headers:
        if col_types[h] == "numeric":
            valid_nums = [float(v) for v in col_data[h] if v is not None]
            if valid_nums:
                vmin = min(valid_nums)
                vmax = max(valid_nums)
                vmean = statistics.mean(valid_nums)
                vmed = statistics.median(valid_nums)
                unique_vals = set(valid_nums)
                note = f" (discrete unique values: {sorted(list(unique_vals))})" if len(unique_vals) <= 5 else ""
                print(f"  - {h}: Min={vmin}, Max={vmax}, Mean={vmean:.2f}, Median={vmed:.2f}{note}")
                
    print("\nCandidate Target Distributions:")
    for h in headers:
        # Check if column could be target
        valid_vals = [v for v in col_data[h] if v is not None]
        unique_cnt = len(set(valid_vals))
        if unique_cnt <= 10 or h.lower() in ("target", "num", "risk", "status", "outcome", "class", "diagnosis", "ckd", "diabetes", "copd", "obesity", "cancer"):
            print(f"  - '{h}' (unique={unique_cnt}): {dict(Counter(valid_vals).most_common(10))}")
    print("\n\n")

if __name__ == "__main__":
    # 1. processed.cleveland.data
    cleveland_cols = ["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal", "target"]
    analyze_file("processed.cleveland.data", custom_headers=cleveland_cols)
    
    # 2. hypertension.csv
    analyze_file("hypertension.csv")
    
    # 3. diabetes_prediction_dataset.csv
    analyze_file("diabetes_prediction_dataset.csv")
    
    # 4. cpod.csv
    analyze_file("cpod.csv")
    
    # 5. CKD_NHANES_2021_2023.csv
    analyze_file("CKD_NHANES_2021_2023.csv")
    
    # 6. obesity.csv
    analyze_file("obesity.csv")
    
    # 7. thyroid_cancer_risk_data-selected-columns (2).csv
    analyze_file("thyroid_cancer_risk_data-selected-columns (2).csv")
