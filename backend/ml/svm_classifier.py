import functools
import json
import logging
import numpy as np
from backend.database.config import supabase

logger = logging.getLogger(__name__)

@functools.lru_cache(maxsize=1)
def get_trained_svc():
    """
    Fetches student encodings from the database and trains an SVM model.
    Applies Gaussian noise augmentation to single samples per student for robust classification.
    """
    from sklearn.svm import SVC
    
    try:
        response = supabase.table('students').select('student_id, face_embedding').execute()
        data = response.data
    except Exception as e:
        logger.error(f"Failed to fetch student embeddings for SVM training: {e}")
        return None
        
    X_raw = []
    y_raw = []
    
    for row in data:
        if row.get('face_embedding') is not None:
            try:
                embedding = row['face_embedding'] 
                if isinstance(embedding, str):
                    embedding = json.loads(embedding)
                    
                X_raw.append(np.array(embedding))
                y_raw.append(row['student_id'])
            except Exception as e:
                logger.warning(f"Error parsing face embedding for student {row.get('student_id')}: {e}")
                
    if len(X_raw) == 0:
        return None
        
    unique_students = list(set(y_raw))
    if len(unique_students) < 2:
        return {"type": "fallback", "X": X_raw, "y": y_raw}
        
    X_aug = []
    y_aug = []
    noise_level = 0.01
    samples_per_student = 10
    
    for emb, s_id in zip(X_raw, y_raw):
        X_aug.append(emb)
        y_aug.append(s_id)
        for _ in range(samples_per_student - 1):
            noise = np.random.normal(0, noise_level, emb.shape)
            X_aug.append(emb + noise)
            y_aug.append(s_id)
            
    clf = SVC(kernel='linear', probability=True)
    clf.fit(X_aug, y_aug)
    
    return {"type": "svc", "model": clf}

def predict_face_embedding(encoding, tolerance=0.6):
    """
    Predicts student identity from a 128D face descriptor vector using trained SVM or distance fallback.
    """
    model_data = get_trained_svc()
    if model_data is None:
        return {"success": False, "error": "Database is empty."}
        
    if model_data["type"] == "fallback":
        X = np.array(model_data["X"])
        y = model_data["y"]
        distances = np.linalg.norm(X - encoding, axis=1)
        min_idx = np.argmin(distances)
        if distances[min_idx] <= tolerance:
            return {
                "success": True,
                "student_id": int(y[min_idx]),
                "confidence": float(1.0 - distances[min_idx])
            }
        return {"success": False, "error": "Face not recognized."}
            
    elif model_data["type"] == "svc":
        clf = model_data["model"]
        encoding_reshaped = encoding.reshape(1, -1)
        prediction = clf.predict(encoding_reshaped)
        probs = clf.predict_proba(encoding_reshaped)[0]
        max_prob = float(max(probs))
        
        if max_prob >= 0.65:
            return {
                "success": True,
                "student_id": int(prediction[0]),
                "confidence": max_prob
            }
        return {"success": False, "error": "Face not recognized (low confidence)."}

def clear_svm_cache():
    """Clears cached SVM classifier model."""
    if hasattr(get_trained_svc, 'cache_clear'):
        get_trained_svc.cache_clear()
