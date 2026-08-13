import functools
import logging
import numpy as np
from backend.database.config import supabase
import json

logger = logging.getLogger(__name__)

@functools.lru_cache(maxsize=1)
def load_dlib_models():
    """Load dlib models once and cache them to avoid high latency."""
    import dlib
    import face_recognition_models
    
    # Frontal face detector
    detector = dlib.get_frontal_face_detector()
    # 68-point shape predictor
    predictor = dlib.shape_predictor(face_recognition_models.pose_predictor_model_location())
    # 128D Face Encoder
    face_encoder = dlib.face_recognition_model_v1(face_recognition_models.face_recognition_model_location())
    
    # CNN detector (for Deep Scan)
    cnn_detector = dlib.cnn_face_detection_model_v1(face_recognition_models.cnn_face_detector_model_location())
    
    return detector, predictor, face_encoder, cnn_detector

def fix_image_rotation(image):
    """
    Corrects image orientation using EXIF metadata (standard for mobile photos).
    Takes a PIL Image and returns a PIL Image.
    """
    from PIL import ImageOps
    return ImageOps.exif_transpose(image)

MAX_DETECTION_DIM = 1280

def get_robust_faces(image_np, detector, cnn_detector, scan_mode="quick"):
    """
    Detects faces based on the selected mode:
    - quick: HOG detector (fast, CPU)
    - deep: CNN detector (highly accurate, handles angles/tilts)
    """
    import dlib
    from PIL import Image
    
    h, w = image_np.shape[:2]
    max_dim = max(h, w)
    scale = 1.0
    detect_image_np = image_np
    
    target_dim = MAX_DETECTION_DIM
    
    if max_dim > target_dim:
        scale = target_dim / max_dim
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        img_pil = Image.fromarray(image_np)
        img_pil = img_pil.resize((new_w, new_h), Image.Resampling.LANCZOS)
        detect_image_np = np.array(img_pil)
    
    faces = dlib.rectangles()
    
    if scan_mode == "quick":
        faces = detector(detect_image_np, 0)
        if len(faces) == 0:
            faces = detector(detect_image_np, 1)
            
    elif scan_mode == "deep":
        try:
            cnn_faces = cnn_detector(detect_image_np, 0)
            for f in cnn_faces:
                faces.append(f.rect)
        except Exception as e:
            logger.warning(f"Deep Scan failed (Memory limit). Using Quick Scan instead: {e}")
            faces = detector(detect_image_np, 1)
            
        if len(faces) == 0:
            if scan_mode == "deep":
                logger.info("Deep Scan found 0 faces. Using Quick Scan fallback...")
            faces = detector(detect_image_np, 1)
        elif scan_mode == "deep":
            logger.info("Deep Scan (CNN) successful!")
            
    if scale != 1.0:
        inv_scale = 1.0 / scale
        final_faces = dlib.rectangles()
        for rect in faces:
            final_faces.append(dlib.rectangle(
                int(rect.left() * inv_scale),
                int(rect.top() * inv_scale),
                int(rect.right() * inv_scale),
                int(rect.bottom() * inv_scale)
            ))
        return final_faces
            
    return faces

def get_face_encoding(image_np, scan_mode="quick"):
    """
    Detects faces, finds landmarks, and returns the 128D encoding for the first face found.
    """
    detector, predictor, face_encoder, cnn_detector = load_dlib_models()
    
    faces = get_robust_faces(image_np, detector, cnn_detector, scan_mode=scan_mode)
            
    if len(faces) == 0:
        return None
        
    shape = predictor(image_np, faces[0])
    face_encoding = np.array(face_encoder.compute_face_descriptor(image_np, shape))
    
    return face_encoding

from backend.ml.svm_classifier import get_trained_svc, predict_face_embedding, clear_svm_cache

def recognize_student_face(image_np, scan_mode="quick", tolerance=0.6):
    """
    Recognizes the face using the trained SVM (or fallback distance).
    """
    encoding = get_face_encoding(image_np, scan_mode=scan_mode)
    if encoding is None:
        return {"success": False, "error": "No face detected in the image."}
        
    return predict_face_embedding(encoding, tolerance=tolerance)

def register_student_face_in_db(student_id: int, image_np):
    """
    Extracts encoding from the image and updates the student's face_embedding in Supabase.
    """
    encoding = get_face_encoding(image_np, scan_mode="quick")
    if encoding is None:
        return {"success": False, "error": "No face detected in the image. Please try again."}
        
    try:
        supabase.table('students').update({
            "face_embedding": encoding.tolist()
        }).eq('student_id', student_id).execute()
        clear_svm_cache()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

def recognize_multiple_faces(image_np, scan_mode="quick", tolerance=0.6):
    """
    Detects multiple faces in an image and recognizes them using the SVM classifier.
    """
    detector, predictor, face_encoder, cnn_detector = load_dlib_models()
    faces = get_robust_faces(image_np, detector, cnn_detector, scan_mode=scan_mode)
            
    if len(faces) == 0:
        return {"success": False, "error": "No faces detected in the image."}
        
    results = []
    for face in faces:
        bbox = [int(face.top()), int(face.right()), int(face.bottom()), int(face.left())]
        shape = predictor(image_np, face)
        encoding = np.array(face_encoder.compute_face_descriptor(image_np, shape))
        
        pred = predict_face_embedding(encoding, tolerance=tolerance)
        if pred.get("success"):
            results.append({
                "student_id": pred["student_id"],
                "confidence": pred["confidence"],
                "bbox": bbox
            })
                
    if len(results) > 0:
        return {"success": True, "data": results}
    return {"success": False, "error": "Faces detected, but none recognized."}

