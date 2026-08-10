const API_BASE_URL = "http://localhost:8001/api";

export async function fetchJson(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.error || "API request failed");
  }
  return data;
}

export async function registerTeacher(username, password, name) {
  return fetchJson("/teacher/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, name }),
  });
}

export async function loginTeacher(username, password) {
  return fetchJson("/teacher/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export async function getTeacherSubjects(teacherId) {
  return fetchJson(`/teacher/subjects/${teacherId}`);
}

export async function createSubject(subjectCode, name, section, teacherId) {
  return fetchJson("/teacher/subjects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject_code: subjectCode,
      name: name,
      section: section,
      teacher_id: teacherId,
    }),
  });
}

export async function uploadGroupPhotos(files, scanMode = "quick") {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("scan_mode", scanMode);

  return fetchJson("/attendance/group-photo", {
    method: "POST",
    body: formData,
  });
}

export async function uploadLiveCamera(imageBlob, scanMode = "quick") {
  const formData = new FormData();
  formData.append("file", imageBlob, "camera_capture.jpg");
  formData.append("scan_mode", scanMode);

  return fetchJson("/attendance/live-camera", {
    method: "POST",
    body: formData,
  });
}

export async function uploadVoiceRecognition(audioBlob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "voice_record.wav");

  return fetchJson("/attendance/voice-recognition", {
    method: "POST",
    body: formData,
  });
}

export async function logAttendanceRecords(subjectId, studentIds) {
  return fetchJson("/attendance/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject_id: subjectId,
      student_ids: studentIds,
    }),
  });
}

export async function getAttendanceRecords(subjectId) {
  return fetchJson(`/attendance/records/${subjectId}`);
}

export async function authenticateStudentFace(imageBlob) {
  const formData = new FormData();
  formData.append("file", imageBlob, "student_face.jpg");

  return fetchJson("/student/authenticate-face", {
    method: "POST",
    body: formData,
  });
}

export async function registerStudent(name, faceEncoding, voiceBlob = null) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("face_encoding", JSON.stringify(faceEncoding));
  if (voiceBlob) {
    formData.append("voice_file", voiceBlob, "voice.wav");
  }

  return fetchJson("/student/register", {
    method: "POST",
    body: formData,
  });
}

export async function getStudentAttendanceSummary(studentId) {
  return fetchJson(`/student/attendance-summary/${studentId}`);
}

export async function getSubjectByCode(subjectCode) {
  return fetchJson(`/student/subject-by-code/${subjectCode}`);
}

export async function enrollStudent(studentId, subjectId) {
  return fetchJson("/student/enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: studentId,
      subject_id: subjectId,
    }),
  });
}
