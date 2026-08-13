"""
SnapClass Biometric SVM Model Evaluation & Metrics Utility
Computes Accuracy, Precision, Recall, F1-Score, Confusion Matrix, and Stratified K-Fold Cross-Validation.
"""

import sys
import os
import json
import numpy as np

# Ensure UTF-8 output encoding for Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure project root workspace directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database.config import supabase
from sklearn.svm import SVC
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

def compute_evaluation_metrics():
    """
    Programmatically calculates model evaluation metrics for database student embeddings.
    Returns a structured dict with accuracy, per-class metrics, and cross-validation scores.
    """
    try:
        response = supabase.table('students').select('student_id, name, face_embedding').execute()
        data = response.data
    except Exception as e:
        return {"success": False, "error": f"Database error: {str(e)}"}

    if not data:
        return {"success": False, "error": "No student biometric records found in Supabase."}

    X_raw, y_raw, names_map = [], [], {}
    for row in data:
        emb = row.get('face_embedding')
        if emb is not None:
            try:
                if isinstance(emb, str):
                    emb = json.loads(emb)
                X_raw.append(np.array(emb))
                y_raw.append(row['student_id'])
                names_map[row['student_id']] = row['name']
            except Exception:
                pass

    if len(X_raw) == 0:
        return {"success": False, "error": "No valid face embeddings registered."}

    unique_students = list(set(y_raw))
    if len(unique_students) < 2:
        return {
            "success": False,
            "error": "Evaluation requires at least 2 enrolled students.",
            "enrolled_students": len(unique_students)
        }

    # Data Augmentation (Gaussian Noise)
    X_aug, y_aug = [], []
    noise_level = 0.01
    samples_per_student = 10

    for emb, s_id in zip(X_raw, y_raw):
        X_aug.append(emb)
        y_aug.append(s_id)
        for _ in range(samples_per_student - 1):
            noise = np.random.normal(0, noise_level, emb.shape)
            X_aug.append(emb + noise)
            y_aug.append(s_id)

    X_aug = np.array(X_aug)
    y_aug = np.array(y_aug)

    # Train-Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X_aug, y_aug, test_size=0.2, random_state=42, stratify=y_aug
    )

    clf = SVC(kernel='linear', probability=True)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    sorted_labels = sorted(unique_students)
    target_names = [names_map.get(s_id, f"ID:{s_id}") for s_id in sorted_labels]

    report_dict = classification_report(y_test, y_pred, labels=sorted_labels, target_names=target_names, output_dict=True)
    report_str = classification_report(y_test, y_pred, labels=sorted_labels, target_names=target_names)
    cm = confusion_matrix(y_test, y_pred, labels=sorted_labels).tolist()

    # Stratified K-Fold Cross-Validation
    n_splits = min(5, len(unique_students))
    cv_scores_list = []
    mean_cv = 0.0
    std_cv = 0.0

    if n_splits >= 2:
        skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
        cv_raw = cross_val_score(clf, X_aug, y_aug, cv=skf)
        cv_scores_list = [round(float(s) * 100, 2) for s in cv_raw]
        mean_cv = float(np.mean(cv_raw))
        std_cv = float(np.std(cv_raw))

    return {
        "success": True,
        "enrolled_students": len(unique_students),
        "total_samples": len(X_aug),
        "accuracy": round(acc * 100, 2),
        "classification_report_str": report_str,
        "classification_report": report_dict,
        "confusion_matrix": cm,
        "labels": sorted_labels,
        "label_names": target_names,
        "cross_validation": {
            "folds": n_splits,
            "per_fold_scores": cv_scores_list,
            "mean_accuracy": round(mean_cv * 100, 2),
            "std_dev": round(std_cv * 100, 2)
        }
    }

def evaluate_face_model():
    print("=" * 65)
    print(" 📊 SnapClass Biometric SVM Model Evaluation & Metrics")
    print("=" * 65)

    res = compute_evaluation_metrics()
    if not res.get("success"):
        print(f"\n[!] {res.get('error')}")
        return

    print(f"\n[+] Total Enrolled Students: {res['enrolled_students']}")
    print(f"[+] Total Evaluated Augmented Samples: {res['total_samples']}")

    print("\n" + "=" * 65)
    print(f"🎯 Test Set Accuracy: {res['accuracy']:.2f}%")
    print("=" * 65)

    print("\n--- 📋 Detailed Classification Report (Precision, Recall, F1-Score) ---")
    print(res['classification_report_str'])

    print("--- 🧩 Confusion Matrix ---")
    print("Student ID Labels:", res['labels'])
    for name, row in zip(res['label_names'], res['confusion_matrix']):
        print(f"{name:<25}: {row}")

    cv = res['cross_validation']
    print(f"\n--- 🔄 {cv['folds']}-Fold Stratified Cross-Validation ---")
    print(f"Per-fold Accuracies: {cv['per_fold_scores']}%")
    print(f"Mean CV Accuracy:    {cv['mean_accuracy']:.2f}% (± {cv['std_dev']:.2f}%)")

if __name__ == "__main__":
    evaluate_face_model()
