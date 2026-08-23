# SnapClass AI - Feature Locations & Implementation Guide

## Overview
SnapClass AI is a biometric attendance system using **Facial Recognition** and **Voice Recognition** with QR code scheduling. Built with **FastAPI** backend and **React** frontend using **Supabase** database.

---

## 🎯 Core Features & Their Locations

### 1. **QR CODE GENERATION** 📱

#### Frontend Implementation
- **Location:** `frontend/src/components/QRModal.jsx`
- **Tool Used:** `qrcode` library (v1.5.4)
- **Logic:**
  ```
  - Generates QR code from enrollment URL
  - URL format: {baseUrl}/?action=enroll&subject_code={subject_code}
  - Displays 300x300px QR code
  - Allows users to download as PNG image
  - QR code encodes the subject enrollment link
  ```
- **Key Functions:**
  - `QRCode.toDataURL()` - Converts URL to QR code image
  - Download functionality using HTML anchor tag
- **Components Used:**
  - React hooks: `useState`, `useEffect`
  - Icons: `Download`, `X` from lucide-react

---

### 2. **SCHEDULE CLASS** 📅

#### Frontend Implementation
- **Location:** `frontend/src/components/ScheduleModal.jsx`
- **Features:**
  - Subject selection dropdown
  - Date picker (day/month/year separate dropdowns)
  - Time picker (start/end times in HH:MM format)
  - Room assignment field
  - Loading state management

#### Backend Implementation
- **Router:** `backend/routers/teacher.py`
  - **Endpoint:** `POST /api/teacher/schedule`
  - **Request Model:** `ScheduleClassRequest`
  - **Function:** `schedule_class(req: ScheduleClassRequest)`

- **Database Layer:** `backend/database/db.py`
  - **Function:** `create_schedule(subject_id, subject_label, date, start_time, end_time, room)`
  - **Storage:** 
    - Primary: Supabase `schedules` table
    - Fallback: In-memory `_in_memory_schedules` list
  - **Fields:** subject_id, subject_label, date, start_time, end_time, room

#### API Client Integration
- **Location:** `frontend/src/api/client.js`
- **Function:** `saveScheduleClass(scheduleData)`
- **Request Format:**
  ```javascript
  {
    subject_id: int,
    subject_label: string (e.g., "CS101 - Data Structures"),
    date: string (e.g., "13 August 2026"),
    start_time: string (e.g., "13:30"),
    end_time: string (e.g., "14:30"),
    room: string (default: "Classroom 301")
  }
  ```

---

### 3. **FACE RECOGNITION ATTENDANCE** 👤

#### Frontend
- **Screen:** `frontend/src/screens/TeacherScreen.jsx` / `frontend/src/screens/HomeScreen.jsx`
- **Components Used:**
  - `AttendanceTable.jsx` - Displays detected faces
  - Camera upload functionality

#### Backend - Face Recognition Pipeline
- **Location:** `backend/pipelines/face_pipeline.py`
- **Tools & Libraries:**
  - `dlib` - Face detection and encoding (128D descriptors)
  - `face_recognition_models` - Pre-trained models
  - `PIL` / `numpy` - Image processing
  - `ImageOps` - EXIF rotation correction

#### Key Functions in Face Pipeline:

1. **`load_dlib_models()`** - Caches 4 models:
   - HOG frontal face detector
   - 68-point shape predictor (landmarks)
   - 128D face encoder
   - CNN face detector (deep scan mode)

2. **`fix_image_rotation(image)`** - Corrects EXIF orientation

3. **`get_robust_faces(image_np, detector, cnn_detector, scan_mode)`**
   - **Modes:**
     - `quick`: HOG detector (fast, CPU-only)
     - `deep`: CNN detector (accurate, memory-intensive)
   - **Image Scaling:** Reduces to 1280px max for performance
   - **Returns:** dlib rectangles of detected faces

4. **`get_face_encoding(image_np, scan_mode)`**
   - Detects faces → computes landmarks → generates 128D encoding
   - Returns single encoding for first face

5. **`recognize_multiple_faces(image_np, scan_mode, tolerance)`**
   - Detects multiple faces in image
   - Uses SVM classifier to match against database
   - Returns: student_id, confidence, bbox for each face

#### Backend - Attendance Endpoints

- **Location:** `backend/routers/attendance.py`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/attendance/group-photo` | POST | Process multiple photos for batch recognition |
| `/api/attendance/live-camera` | POST | Real-time camera frame processing |
| `/api/attendance/voice-recognition` | POST | Voice recognition for attendance |
| `/api/attendance/log` | POST | Save attendance to database |
| `/api/attendance/records/{subject_id}` | GET | Fetch attendance records |

#### Group Photo Processing Logic:
```
1. Accept up to 5 image files
2. Convert each to RGB numpy array
3. Fix EXIF rotation using fix_image_rotation()
4. Call recognize_multiple_faces() on each
5. Deduplicate by student_id (keep highest confidence)
6. Fetch student names from database
7. Return aggregated results with photo sources
```

#### Database Layer
- **Location:** `backend/database/db.py`
- **Key Functions:**
  - `register_student_face_in_db(student_id, image_np)` - Stores face encoding
  - `log_attendance(subject_id, student_ids, is_present=True)` - Logs attendance
  - `get_attendance_records(subject_id)` - Retrieves attendance history
  - `get_enrolled_students(subject_id)` - Gets class enrollment

---

### 4. **VOICE RECOGNITION ATTENDANCE** 🎤

#### Backend - Voice Pipeline
- **Location:** `backend/pipelines/voice_pipeline.py`
- **Tools & Libraries:**
  - `resemblyzer` - Speaker embedding (256D descriptors)
  - `librosa` - Audio processing
  - `soundfile` - WAV reading
  - `imageio-ffmpeg` - Multi-codec audio decoding
  - `numpy` - Vector operations

#### Key Functions:

1. **`load_voice_encoder()`** - Caches Resemblyzer model

2. **`load_audio_as_16k_wav(audio_input)`**
   - Supports: WebM, Opus, Ogg, WAV, MP3
   - Three fallback methods:
     1. soundfile direct read
     2. FFmpeg conversion (bundled)
     3. librosa fallback
   - Converts to 16kHz mono float32

3. **`get_voice_encoding(audio_input)`**
   - Validates audio energy (RMS > 0.005, max_amplitude > 0.015)
   - Rejects silence
   - Pads short samples to 0.5s minimum
   - Returns 256D speaker embedding

4. **`recognize_multiple_voices(audio_input, threshold)`**
   - Computes cosine similarity between input and known voices
   - Threshold: 0.65 (configurable)
   - Returns matching students with confidence scores

#### Database Integration
- Stores `voice_embedding` (JSON list) per student
- Functions:
  - `register_student_voice_in_db(student_id, audio_input)`
  - `get_known_voices()` - Loads all voice embeddings

---

### 5. **STUDENT REGISTRATION** 👤

#### Frontend
- **Location:** `frontend/src/screens/StudentScreen.jsx`
- **Components:** 
  - Face capture from camera
  - Voice recording capture
  - QR code enrollment

#### Backend
- **Location:** `backend/routers/student.py`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/student/register` | POST | Register new student with face & voice |
| `/api/student/authenticate-face` | POST | Verify face for enrollment |
| `/api/student/enroll` | POST | Enroll student in subject |
| `/api/student/enrollment-summary/{student_id}` | GET | Get attendance summary |

#### Database Functions
- `create_student(name, face_embedding, voice_embedding)` - Stores new student
- `enroll_student(student_id, subject_id)` - Enrolls in subject

---

### 6. **ML MODEL & SVM CLASSIFIER** 🤖

#### Location
- `backend/ml/svm_classifier.py` - SVM for face recognition
- `backend/ml/evaluate_model.py` - Model metrics

#### Logic
- Uses scikit-learn SVM to classify face encodings
- Trained on stored student face embeddings
- Predicts student ID with confidence scores
- Threshold-based matching (default tolerance: 0.6)

---

## 📊 Database Schema

### Supabase Tables:
- **teachers** - Teacher accounts (username, hashed_password, name)
- **subjects** - Courses (subject_code, name, section, teacher_id)
- **students** - Student records (name, face_embedding, voice_embedding)
- **subject_students** - Enrollment junction table
- **attendence_logs** - Attendance records (subject_id, student_id, timestamp, is_present)
- **schedules** - Class schedules (subject_id, date, start_time, end_time, room)

---

## 🛠️ Technology Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** bcrypt password hashing
- **Face Recognition:** dlib + face_recognition_models
- **Voice Recognition:** resemblyzer + librosa
- **API Documentation:** FastAPI Swagger UI (/docs)
- **CORS:** Enabled for local development

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **UI Library:** React + lucide-react (icons)
- **QR Generation:** qrcode library
- **Styling:** CSS variables (custom theme)
- **API Calls:** Fetch API via client wrapper

### Dependencies (Python)
```
fastapi
numpy
scikit-learn
dlib-bin
supabase
bcrypt
pillow
librosa==0.11.0
resemblyzer==0.1.4
```

### Dependencies (JavaScript)
```
react: ^19.2.8
qrcode: ^1.5.4
lucide-react: ^1.31.0
vite: ^8.2.0
```

---

## 🔄 Data Flow

### Attendance Process (Face)
```
Teacher/Student → Upload Photo/Camera Frame
  ↓
face_pipeline.recognize_multiple_faces()
  ↓
dlib detects faces → SVM classifies → Returns student IDs
  ↓
Frontend displays detected students
  ↓
Teacher confirms & submits
  ↓
log_attendance() → Saves to Supabase
  ↓
Attendance summary generated
```

### Attendance Process (Voice)
```
Student → Record Audio
  ↓
voice_pipeline.recognize_multiple_voices()
  ↓
Load audio → Extract 256D embedding → Cosine similarity matching
  ↓
Threshold check (0.65) → Match to student
  ↓
log_attendance() → Save to database
```

### Schedule Creation
```
Teacher → ScheduleModal
  ↓
Fills subject, date, time, room
  ↓
POST /api/teacher/schedule
  ↓
create_schedule() in db.py
  ↓
Stored in Supabase schedules table (or fallback memory)
```

---

## 📝 Example API Requests

### Schedule Class
```bash
POST /api/teacher/schedule
Content-Type: application/json

{
  "subject_id": 1,
  "subject_label": "CS101 - Data Structures",
  "date": "13 August 2026",
  "start_time": "13:30",
  "end_time": "14:30",
  "room": "Classroom 301"
}
```

### Group Photo Attendance
```bash
POST /api/attendance/group-photo
Content-Type: multipart/form-data

files: [image1.jpg, image2.jpg, ...]
scan_mode: "quick" | "deep"
```

### Voice Recognition
```bash
POST /api/attendance/voice-recognition
Content-Type: multipart/form-data

file: audio.wav
```

---

## ⚙️ Configuration & Tuning

### Face Recognition Tuning
- **Scan Mode:** `quick` (HOG) or `deep` (CNN) in `face_pipeline.py`
- **Max Detection Dimension:** 1280px (line 51)
- **Tolerance:** 0.6 (configurable in `recognize_student_face()`)

### Voice Recognition Tuning
- **Threshold:** 0.65 cosine similarity (adjustable)
- **Energy Thresholds:** RMS > 0.005, Max Amplitude > 0.015
- **Min Audio Length:** 0.5s (8000 samples @ 16kHz)

### Silence Detection Logic
```python
rms_energy = sqrt(mean(wav^2))
max_amplitude = max(|wav|)

if rms_energy < 0.005 or max_amplitude < 0.015:
    # Reject as silence/noise
```

---

## 🚀 Running the System

### Backend
```bash
python backend/main.py
# Runs on http://127.0.0.1:8001
# Swagger docs: http://127.0.0.1:8001/docs
```

### Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

---

## 📍 File Tree Reference

```
backend/
├── main.py                    # FastAPI app setup
├── database/
│   ├── db.py                  # Database operations
│   └── config.py              # Supabase client config
├── pipelines/
│   ├── face_pipeline.py       # Face recognition
│   └── voice_pipeline.py      # Voice recognition
├── routers/
│   ├── teacher.py             # Teacher endpoints (schedule, subjects)
│   ├── student.py             # Student endpoints (enrollment)
│   └── attendance.py          # Attendance endpoints (photo, voice, logging)
└── ml/
    ├── svm_classifier.py      # SVM model
    └── evaluate_model.py      # Model evaluation

frontend/
├── src/
│   ├── api/
│   │   └── client.js          # API wrapper
│   ├── components/
│   │   ├── QRModal.jsx        # QR code generation
│   │   ├── ScheduleModal.jsx  # Schedule class form
│   │   ├── AttendanceTable.jsx # Attendance display
│   │   ├── Sidebar.jsx        # Navigation
│   │   └── TopHeader.jsx      # Header
│   └── screens/
│       ├── HomeScreen.jsx     # Home page
│       ├── TeacherScreen.jsx  # Teacher dashboard
│       └── StudentScreen.jsx  # Student enrollment
```

---

## 🔐 Security Notes

- **Passwords:** Hashed with bcrypt (rounds=4)
- **Database:** Supabase PostgreSQL with CORS enabled
- **API:** CORS enabled for development (allow_origins=["*"])
- **Face/Voice Data:** Stored as embeddings (non-reversible 128D/256D vectors)

---

**Last Updated:** August 17, 2026
**Project:** SnapClass AI Biometric Attendance System v2.0.0

