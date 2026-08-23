# 🎓 SnapClass: Next-Gen AI Biometric Attendance System

> A modern, decoupled educational platform (React + FastAPI) that replaces manual roll-calls with instant, multi-modal biometric authentication (Face & Voice).

![Python](https://img.shields.io/badge/Python-3.x-blue.svg?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Framework-009688.svg?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-UI-61DAFB.svg?style=for-the-badge&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E.svg?style=for-the-badge&logo=supabase)
![Machine Learning](https://img.shields.io/badge/AI-Biometrics-purple.svg?style=for-the-badge)

## 🌟 Overview

SnapClass is a state-of-the-art attendance management system built to streamline classroom operations and eliminate proxy attendance. By leveraging advanced deep learning models for both **Facial Recognition** and **Voice Verification**, it ensures highly secure and frictionless attendance logging.

The application uses a modern decoupled architecture:
- **Backend:** A high-performance Python `FastAPI` server driving the Machine Learning logic.
- **Frontend:** A premium, responsive `React` (Vite) Single Page Application (SPA), providing an intuitive, glassmorphism-inspired experience for both educators and students.
- **Database:** `Supabase` handles real-time synchronization and vector data storage securely.

---

## ✨ Key Features

### 👨‍🏫 Teacher Dashboard
*   **📸 Group Photo Analysis:** Upload up to 5 photos of a classroom simultaneously. The AI detects all faces in the crowd, cross-references the 128D embeddings, and logs attendance instantly.
*   **📷 Live Camera Scanning:** Use a device webcam for real-time classroom scanning. Features a dynamic fallback pipeline to handle low resolution, extreme angles, and poor lighting.
*   **🎤 Voice Verification:** Biometrically verify a specific student using unique audio feature extraction.
*   **📚 Subject Management:** Create multiple subjects, monitor enrolled student counts, and track total classes held.
*   **📊 Analytics & Records:** Filterable, interactive React grids displaying past attendance records with visual summaries.
*   **🖨️ Connect & Register:** Instantly generate QR Codes on the frontend for rapid student course enrollment.

### 👩‍🎓 Student Portal
*   **🔐 Biometric Enrollment:** A seamless onboarding flow where students register their unique facial map and voice print.
*   **📖 Easy Course Enrollment:** Join classes instantly using secure Subject Codes or QR Codes provided by the teacher.
*   **🔔 Scheduling Notifications:** Get instant alerts and modals about upcoming classes and teacher schedules.

---

## 🧠 Technical Architecture & AI Pipelines

### 1. Robust Face Recognition Pipeline (`backend/pipelines/face_pipeline.py`)
Standard face detectors often fail on webcam feeds due to scaling issues or head tilts. This project utilizes a highly custom, multi-pass detection strategy using `dlib`:
1. **Zero-Upsample Scan:** Designed specifically to catch large, close-up faces (common in webcam usage) that exceed standard HOG sliding window sizes.
2. **Grayscale Enhancement:** Converts the image to grayscale and applies contrast adjustments to handle poor lighting.
3. **Dynamic Downsampling:** If a face is too large, the system shrinks the image, detects the face, and extrapolates the bounding box back to the original resolution.
4. **CNN Deep Learning Fallback:** If HOG detection completely fails due to an extreme head tilt, a Convolutional Neural Network (CNN) kicks in to locate the face.
5. **128D Encoding & Distance Matching:** The detected face is passed through a ResNet network to generate a 128-dimensional biometric vector. Recognition is achieved via Euclidean distance calculations against the Supabase dataset (or via an SVM classifier).

### 2. Voice Recognition Pipeline (`backend/pipelines/voice_pipeline.py`)
*   Powered by `librosa`, `imageio-ffmpeg`, and `resemblyzer`.
*   Acts as a universal translator, taking raw web-audio files from the browser and extracting highly unique audio features.
*   Converts the audio profile into a standardized array stored securely in the database for future voice-matching.

### 3. Cloud Database (`Supabase / PostgreSQL`)
*   **Real-time sync:** Instant, scalable updates across the Teacher and Student dashboards.
*   **Vector Storage:** Securely stores the biometric identifiers and relational data (Teachers, Students, Classes, Enrollments).

---

## 📂 Folder Structure

```text
snapclass/
│
├── backend/
│   ├── database/        # Supabase config & DB interactions (config.py, db.py)
│   ├── ml/              # Machine learning models (SVM classifiers, modeling data)
│   ├── pipelines/       # AI biometric logic (face_pipeline.py, voice_pipeline.py)
│   ├── routers/         # FastAPI Route handlers (teacher, student, attendance)
│   ├── main.py          # FastAPI application entry point
│   └── seed.py          # Database table creation script
│
├── frontend/            # React + Vite Frontend App
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── api/         # Axios/Fetch clients communicating with backend API
│   │   ├── components/  # React UI Components (Headers, Modals, Forms)
│   │   ├── screens/     # React Display Views (Home, Teacher, Student)
│   │   ├── App.jsx      # Main React Router setup
│   │   └── index.css    # Global CSS stylesheets
│   ├── package.json     # Node dependencies
│   └── vite.config.js   # Vite compilation system settings
│
├── .env.example         # Template for environment variables (Supabase Keys)
└── requirements.txt     # Python backend dependencies
```

---

## ⚡ Getting Started (Local Development)

### 1. Database Setup
1. Copy `.env.example` to `.env`.
2. Add your `SUPABASE_URL` and `SUPABASE_KEY` from your Supabase dashboard.
3. Run the database seed script to prepare tables:
   ```bash
   python backend/seed.py
   ```

### 2. Run the Backend (FastAPI)
1. Install Python packages:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the Uvicorn server:
   ```bash
   python backend/main.py
   ```
   *The backend API will run on `http://127.0.0.1:8001`*

### 3. Run the Frontend (React)
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173` (or the port specified in terminal).*
