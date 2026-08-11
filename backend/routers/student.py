from fastapi import APIRouter, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional
import numpy as np
from PIL import Image
import io
import json

from backend.database.db import (
    create_student,
    get_subject_by_code,
    enroll_student,
    get_student_attendance_summary
)
from backend.pipelines.face_pipeline import (
    recognize_student_face,
    get_face_encoding,
    get_trained_svc,
    fix_image_rotation
)
from backend.pipelines.voice_pipeline import (
    get_voice_encoding,
    get_known_voices
)

router = APIRouter(prefix="/api/student", tags=["Student"])

class StudentEnrollRequest(BaseModel):
    student_id: int
    subject_id: int

@router.post("/authenticate-face")
async def authenticate_face(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        image = fix_image_rotation(image)
        img_array = np.array(image.convert("RGB"))
        
        result = recognize_student_face(img_array)
        if result.get("success"):
            return result
            
        encoding = get_face_encoding(img_array)
        if encoding is None:
            return {"success": False, "error": "No clear face detected in the image."}
            
        return {
            "success": False,
            "error": "Face not recognized. Ready for registration.",
            "face_encoding": encoding.tolist()
        }
    except Exception as e:
        return {"success": False, "error": f"Face authentication failed: {str(e)}"}

@router.post("/register")
async def register(
    name: str = Form(...),
    face_encoding: str = Form(...),
    voice_file: Optional[UploadFile] = File(None)
):
    try:
        face_emb = json.loads(face_encoding)
        voice_emb_list = None
        
        if voice_file is not None:
            v_contents = await voice_file.read()
            voice_emb = get_voice_encoding(io.BytesIO(v_contents))
            if voice_emb is not None:
                voice_emb_list = voice_emb.tolist()
                
        res = create_student(name, face_emb, voice_emb_list)
        if res["success"]:
            if hasattr(get_trained_svc, 'cache_clear'):
                get_trained_svc.cache_clear()
            elif hasattr(get_trained_svc, 'clear'):
                get_trained_svc.clear()

            if hasattr(get_known_voices, 'cache_clear'):
                get_known_voices.cache_clear()
            elif hasattr(get_known_voices, 'clear'):
                get_known_voices.clear()
            return res
        else:
            return {"success": False, "error": res.get("error", "Failed to register student")}
    except Exception as e:
        return {"success": False, "error": f"Registration failed: {str(e)}"}

@router.get("/attendance-summary/{student_id}")
def attendance_summary(student_id: int):
    summary = get_student_attendance_summary(student_id)
    return {"success": True, "data": summary}

@router.post("/enroll")
def enroll(req: StudentEnrollRequest):
    res = enroll_student(req.student_id, req.subject_id)
    if not res["success"]:
        return {"success": False, "error": res.get("error", "Enrollment failed")}
    return res

@router.get("/subject-by-code/{subject_code}")
def fetch_subject_by_code(subject_code: str):
    res = get_subject_by_code(subject_code)
    if not res["success"]:
        return {"success": False, "error": res.get("error", "Subject not found")}
    return res
