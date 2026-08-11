from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.database.db import (
    register_teacher,
    login_teacher,
    get_teacher_subjects,
    create_subject,
    get_enrolled_students
)
from backend.database.config import supabase

router = APIRouter(prefix="/api/teacher", tags=["Teacher"])

class TeacherRegisterRequest(BaseModel):
    username: str
    password: str
    name: str

class TeacherLoginRequest(BaseModel):
    username: str
    password: str

class CreateSubjectRequest(BaseModel):
    subject_code: str
    name: str
    section: str
    teacher_id: int

@router.post("/register")
def register(req: TeacherRegisterRequest):
    res = register_teacher(req.username, req.password, name=req.name)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res.get("error", "Registration failed"))
    return res

@router.post("/login")
def login(req: TeacherLoginRequest):
    res = login_teacher(req.username, req.password)
    if not res["success"]:
        raise HTTPException(status_code=401, detail=res.get("error", "Invalid credentials"))
    return res

@router.get("/subjects/{teacher_id}")
def fetch_subjects(teacher_id: int):
    subjects = get_teacher_subjects(teacher_id)
    if subjects:
        for s in subjects:
            subj_id = s['subject_id']
            enrolled = get_enrolled_students(subj_id)
            s['enrolled_count'] = len(enrolled)
            try:
                logs = supabase.table('attendence_logs').select('timestamp').eq('subject_id', subj_id).execute()
                s['classes_held'] = len(set([log['timestamp'] for log in logs.data]))
            except Exception:
                s['classes_held'] = 0
    return {"success": True, "data": subjects}

@router.post("/subjects")
def add_subject(req: CreateSubjectRequest):
    res = create_subject(req.subject_code, req.name, req.section, req.teacher_id)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to create subject"))
    return res
