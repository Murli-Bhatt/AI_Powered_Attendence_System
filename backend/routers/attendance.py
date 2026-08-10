from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from PIL import Image
import io

from backend.database.db import (
    log_attendance,
    get_attendance_records,
    get_enrolled_students
)
from backend.pipelines.face_pipeline import (
    recognize_multiple_faces,
    fix_image_rotation
)
from backend.pipelines.voice_pipeline import (
    recognize_multiple_voices
)
from backend.database.config import supabase

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

class LogAttendanceRequest(BaseModel):
    subject_id: int
    student_ids: List[int]

@router.post("/group-photo")
async def process_group_photo(
    files: List[UploadFile] = File(...),
    scan_mode: str = Form("quick")
):
    try:
        all_detected = []
        last_error = "No faces recognized."
        for idx, u_file in enumerate(files[:5]):
            contents = await u_file.read()
            img = Image.open(io.BytesIO(contents))
            img = fix_image_rotation(img)
            img_array = np.array(img.convert("RGB"))
            
            res = recognize_multiple_faces(img_array, scan_mode=scan_mode)
            if res["success"]:
                for match in res["data"]:
                    match["source"] = f"Photo {idx + 1}"
                    all_detected.append(match)
            else:
                last_error = res.get("error", last_error)

        if not all_detected:
            return {"success": False, "error": last_error, "data": []}

        deduped = {}
        for match in all_detected:
            s_id = match["student_id"]
            if s_id not in deduped:
                deduped[s_id] = {
                    "student_id": s_id,
                    "confidence": match["confidence"],
                    "sources": [match["source"]]
                }
            else:
                if match["source"] not in deduped[s_id]["sources"]:
                    deduped[s_id]["sources"].append(match["source"])
                if match["confidence"] > deduped[s_id]["confidence"]:
                    deduped[s_id]["confidence"] = match["confidence"]

        detected_list = list(deduped.values())
        student_ids = [m["student_id"] for m in detected_list]

        name_map = {}
        if student_ids:
            try:
                name_res = supabase.table('students').select('student_id, name').in_('student_id', student_ids).execute()
                name_map = {row['student_id']: row['name'] for row in name_res.data}
            except Exception:
                pass

        for m in detected_list:
            m["name"] = name_map.get(m["student_id"], f"Student ID #{m['student_id']}")

        return {"success": True, "data": detected_list}
    except Exception as e:
        return {"success": False, "error": f"Group photo processing failed: {str(e)}", "data": []}

@router.post("/live-camera")
async def process_live_camera(
    file: UploadFile = File(...),
    scan_mode: str = Form("quick")
):
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents))
        img = fix_image_rotation(img)
        img_array = np.array(img.convert("RGB"))
        
        res = recognize_multiple_faces(img_array, scan_mode=scan_mode)
        if not res["success"]:
            return {"success": False, "error": res.get("error", "No face recognized."), "data": []}
            
        detected_list = res["data"]
        for match in detected_list:
            match["sources"] = ["Camera"]
            
        student_ids = [m["student_id"] for m in detected_list]
        name_map = {}
        if student_ids:
            try:
                name_res = supabase.table('students').select('student_id, name').in_('student_id', student_ids).execute()
                name_map = {row['student_id']: row['name'] for row in name_res.data}
            except Exception:
                pass

        for m in detected_list:
            m["name"] = name_map.get(m["student_id"], f"Student ID #{m['student_id']}")

        return {"success": True, "data": detected_list}
    except Exception as e:
        return {"success": False, "error": f"Camera processing failed: {str(e)}", "data": []}

@router.post("/voice-recognition")
async def process_voice_recognition(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        audio_buffer = io.BytesIO(contents)
        
        res = recognize_multiple_voices(audio_buffer)
        if not res["success"]:
            return {"success": False, "error": res.get("error", "Voice not recognized."), "data": []}
            
        detected_list = res["data"]
        for match in detected_list:
            match["sources"] = ["Voice"]
            
        student_ids = [m["student_id"] for m in detected_list]
        name_map = {}
        if student_ids:
            try:
                name_res = supabase.table('students').select('student_id, name').in_('student_id', student_ids).execute()
                name_map = {row['student_id']: row['name'] for row in name_res.data}
            except Exception:
                pass

        for m in detected_list:
            m["name"] = name_map.get(m["student_id"], f"Student ID #{m['student_id']}")

        return {"success": True, "data": detected_list}
    except Exception as e:
        return {"success": False, "error": f"Voice processing failed: {str(e)}", "data": []}

@router.post("/log")
def submit_attendance_log(req: LogAttendanceRequest):
    unique_ids = list(set(req.student_ids))
    res = log_attendance(req.subject_id, unique_ids)
    if not res["success"]:
        return {"success": False, "error": res.get("error", "Failed to log attendance")}
        
    enrolled_students = get_enrolled_students(req.subject_id)
    present_ids = set(unique_ids)
    
    present_list = []
    absent_list = []
    
    for s in enrolled_students:
        if s["student_id"] in present_ids:
            present_list.append(s["name"])
        else:
            absent_list.append(s["name"])

    return {
        "success": True,
        "summary": {
            "present": present_list,
            "absent": absent_list
        }
    }

@router.get("/records/{subject_id}")
def fetch_attendance_records(subject_id: int):
    records = get_attendance_records(subject_id)
    return {"success": True, "data": records}
