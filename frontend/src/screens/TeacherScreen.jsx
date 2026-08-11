import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap, Camera, Mic, BookOpen, BarChart2,
  LogOut, Plus, CheckCircle, AlertCircle, QrCode, Upload, Lock, Calendar
} from 'lucide-react';
import {
  loginTeacher, registerTeacher, getTeacherSubjects, createSubject,
  uploadGroupPhotos, uploadLiveCamera, uploadVoiceRecognition,
  logAttendanceRecords, getAttendanceRecords
} from '../api/client';
import QRModal from '../components/QRModal';
import AttendanceTable from '../components/AttendanceTable';
import ScheduleModal from '../components/ScheduleModal';

export default function TeacherScreen({
  initialTab = 'take_attendance',
  teacher: externalTeacher = null,
  onLoginSuccess = () => {},
  onLogout = () => {}
}) {
  const [authView, setAuthView] = useState(externalTeacher ? 'dashboard' : 'login');
  const [teacher, setTeacher] = useState(externalTeacher);

  useEffect(() => {
    if (externalTeacher) {
      setTeacher(externalTeacher);
      setAuthView('dashboard');
    } else {
      setTeacher(null);
      setAuthView('login');
    }
  }, [externalTeacher]);

  // Auth Form State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', username: '', password: '', confirmPassword: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState('');

  // Dashboard State
  const [activeTab, setActiveTab] = useState(initialTab); // 'take_attendance' | 'manage_subject' | 'attendance_record'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [attendanceSubTab, setAttendanceSubTab] = useState('upload'); // 'upload' | 'camera' | 'voice'
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [scanMode, setScanMode] = useState('quick'); // 'quick' | 'deep'

  // Photo / Camera / Voice Processing State
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [detectedStudents, setDetectedStudents] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQRSubject, setSelectedQRSubject] = useState(null);

  // New Subject Form State
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubSection, setNewSubSection] = useState('');

  // Webcam & Audio Recording References
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Fetch Teacher Subjects on Login
  const loadSubjects = async (tId) => {
    try {
      const res = await getTeacherSubjects(tId);
      if (res.success) {
        setSubjects(res.data);
        if (res.data.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(res.data[0].subject_id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (teacher) {
      loadSubjects(teacher.teacher_id);
    }
  }, [teacher]);

  // Auth Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await loginTeacher(loginForm.username, loginForm.password);
      if (res.success) {
        setTeacher(res.data);
        setAuthView('dashboard');
        onLoginSuccess(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (regForm.password !== regForm.confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    try {
      const res = await registerTeacher(regForm.username, regForm.password, regForm.name);
      if (res.success) {
        setSuccessMsg("Registration successful! Please login.");
        setLoginForm({ username: regForm.username, password: regForm.password });
        setAuthView('login');
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Subject Handlers
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubCode || !newSubName || !newSubSection) return;
    try {
      const res = await createSubject(newSubCode, newSubName, newSubSection, teacher.teacher_id);
      if (res.success) {
        setNewSubCode('');
        setNewSubName('');
        setNewSubSection('');
        loadSubjects(teacher.teacher_id);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Attendance Scans
  const handleGroupPhotoAnalyze = async () => {
    if (selectedPhotos.length === 0) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await uploadGroupPhotos(selectedPhotos, scanMode);
      if (res.success) {
        setDetectedStudents(res.data);
      } else {
        setErrorMsg(res.error || "No faces recognized.");
        setDetectedStudents([]);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Webcam Controls
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      alert("Unable to access camera: " + err.message);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureCameraScan = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(async (blob) => {
      setLoading(true);
      try {
        const res = await uploadLiveCamera(blob, scanMode);
        if (res.success) {
          setDetectedStudents(res.data);
        } else {
          setErrorMsg(res.error || "No face recognized");
        }
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }, 'image/jpeg');
  };

  const [recordedVoiceBlob, setRecordedVoiceBlob] = useState(null);
  const [recordedVoiceUrl, setRecordedVoiceUrl] = useState(null);

  // Voice Controls
  const startVoiceRecording = async () => {
    audioChunksRef.current = [];
    setRecordedVoiceBlob(null);
    setRecordedVoiceUrl(null);
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.streamRef = stream;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordedVoiceBlob(audioBlob);
        setRecordedVoiceUrl(URL.createObjectURL(audioBlob));
        if (mediaRecorder.streamRef) {
          mediaRecorder.streamRef.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      setRecordingVoice(true);
    } catch (err) {
      alert("Microphone access failed: " + err.message);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecordingVoice(false);
    }
  };

  const handleAnalyzeVoice = async () => {
    if (!recordedVoiceBlob) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await uploadVoiceRecognition(recordedVoiceBlob);
      if (res.success) {
        setDetectedStudents(res.data);
      } else {
        setErrorMsg(res.error || "Voice not recognized");
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Confirm Attendance Log
  const handleConfirmLog = async () => {
    if (!selectedSubjectId || detectedStudents.length === 0) return;
    const studentIds = detectedStudents.map((s) => s.student_id);
    setLoading(true);
    try {
      const res = await logAttendanceRecords(parseInt(selectedSubjectId), studentIds);
      if (res.success) {
        setAttendanceSummary(res.summary);
        setDetectedStudents([]);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Attendance Records
  const loadAttendanceRecords = async (subId) => {
    if (!subId) return;
    try {
      const res = await getAttendanceRecords(parseInt(subId));
      if (res.success) {
        setRecords(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance_record' && selectedSubjectId) {
      loadAttendanceRecords(selectedSubjectId);
    }
  }, [activeTab, selectedSubjectId]);

  return (
    <div style={{ width: '100%', margin: '0 auto' }}>
      {/* Auth Screens */}
      {authView !== 'dashboard' ? (
        <div style={{ maxWidth: '460px', margin: '0 auto', textAlign: 'center' }}>
          {/* THDC-IHET Institutional Header - Centered Directly Above Card */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '3px solid var(--primary-navy)',
              padding: '6px',
              margin: '0 auto 0.8rem auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
            }}>
              <img
                src="/thdc-logo.png"
                alt="THDC Institute Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
            <h1 style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: '1.35rem',
              fontWeight: '900',
              color: 'var(--primary-navy)',
              letterSpacing: '0.8px',
              lineHeight: '1.25',
              textTransform: 'uppercase',
              marginBottom: '0.4rem'
            }}>
              THDC INSTITUTE OF HYDROPOWER ENGINEERING AND TECHNOLOGY
            </h1>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              TEHRI GARHWAL | CAMPUS INSTITUTE OF UTU
            </div>
            <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '1.15rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>
              AUTOMATED BIOMETRIC ATTENDANCE SYSTEM
            </p>
          </div>

          {/* Theme-aware Card Container */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '32px',
            padding: '2.5rem 2.25rem',
            boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.15)',
            textAlign: 'left',
            color: 'var(--text-primary)'
          }}>
            {errorMsg && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div style={{ padding: '10px 14px', background: '#ccfbf1', border: '1px solid #99f6e4', color: '#0d9488', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                {successMsg}
              </div>
            )}

            {authView === 'login' ? (
              <form onSubmit={handleLogin}>
                <h3 style={{ fontFamily: "'Times New Roman', Times, serif", textAlign: 'center', marginBottom: '1.5rem', color: '#2e3075', fontWeight: '800', fontSize: '1.4rem' }}>
                  FACULTY LOGIN
                </h3>
                
                <label style={{ fontSize: '0.75rem', color: '#374151', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  USERNAME
                </label>
                <input
                  className="input-field"
                  style={{
                    background: '#f9fafb',
                    color: '#111827',
                    borderRadius: '9999px',
                    padding: '12px 20px',
                    border: '1.5px solid #d1d5db',
                    marginTop: '6px',
                    marginBottom: '1.2rem',
                    fontSize: '0.92rem'
                  }}
                  placeholder="Enter institutional username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                />

                <label style={{ fontSize: '0.75rem', color: '#374151', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  PASSWORD
                </label>
                <input
                  type="password"
                  className="input-field"
                  style={{
                    background: '#f9fafb',
                    color: '#111827',
                    borderRadius: '9999px',
                    padding: '12px 20px',
                    border: '1.5px solid #d1d5db',
                    marginTop: '6px',
                    marginBottom: '1.5rem',
                    fontSize: '0.92rem'
                  }}
                  placeholder="Enter account password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />

                {/* Deep Navy Lock Icon Login Button */}
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(180deg, #3b3e8c 0%, #2e3075 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '9999px',
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(46, 48, 117, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Lock size={18} color="#00c853" /> LOGIN
                </button>

                <div style={{ textAlign: 'center', margin: '1.2rem 0 1rem 0', fontSize: '0.8rem', color: '#9ca3af', fontWeight: '700' }}>
                  OR
                </div>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    color: '#1f2937',
                    border: '1.5px solid #d1d5db',
                    padding: '12px',
                    borderRadius: '9999px',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onClick={() => alert("Google Single Sign-On initialized.")}
                >
                  <span style={{ fontWeight: '800', color: '#4285F4' }}>G</span> Sign in with Google
                </button>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 'none', color: '#00c853', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer' }}
                    onClick={() => { setErrorMsg(''); setAuthView('register'); }}
                  >
                    Need an account? Register New Faculty
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <h3 style={{ fontFamily: "'Times New Roman', Times, serif", textAlign: 'center', marginBottom: '1.5rem', color: '#ffffff', fontWeight: '800', fontSize: '1.4rem' }}>
                  FACULTY REGISTRATION
                </h3>

                <label style={{ fontSize: '0.75rem', color: '#e5e7eb', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  FULL NAME
                </label>
                <input
                  className="input-field"
                  style={{ background: '#ffffff', color: '#1f2937', borderRadius: '9999px', padding: '12px 20px', border: 'none', marginTop: '4px', marginBottom: '1rem' }}
                  placeholder="e.g. Dr. John Doe"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  required
                />

                <label style={{ fontSize: '0.75rem', color: '#e5e7eb', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  USERNAME
                </label>
                <input
                  className="input-field"
                  style={{ background: '#ffffff', color: '#1f2937', borderRadius: '9999px', padding: '12px 20px', border: 'none', marginTop: '4px', marginBottom: '1rem' }}
                  placeholder="Choose username"
                  value={regForm.username}
                  onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                  required
                />

                <label style={{ fontSize: '0.75rem', color: '#e5e7eb', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  PASSWORD
                </label>
                <input
                  type="password"
                  className="input-field"
                  style={{ background: '#ffffff', color: '#1f2937', borderRadius: '9999px', padding: '12px 20px', border: 'none', marginTop: '4px', marginBottom: '1rem' }}
                  placeholder="Create password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  required
                />

                <label style={{ fontSize: '0.75rem', color: '#e5e7eb', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  CONFIRM PASSWORD
                </label>
                <input
                  type="password"
                  className="input-field"
                  style={{ background: '#ffffff', color: '#1f2937', borderRadius: '9999px', padding: '12px 20px', border: 'none', marginTop: '4px', marginBottom: '1.2rem' }}
                  placeholder="Repeat password"
                  value={regForm.confirmPassword}
                  onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                  required
                />

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(180deg, #3b3e8c 0%, #2e3075 100%)',
                    color: '#ffffff',
                    border: '2px solid #e5e7eb',
                    padding: '14px',
                    borderRadius: '9999px',
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  REGISTER ACCOUNT
                </button>

                <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 'none', color: '#00c853', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
                    onClick={() => { setErrorMsg(''); setAuthView('login'); }}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* Teacher Dashboard Hub */
        <div>

          {/* TAB 1: TAKE ATTENDANCE */}
          {activeTab === 'take_attendance' && (
            <div className="glass-card" style={{ background: 'var(--bg-card)', borderRadius: '28px', border: '1px solid var(--border)', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.25)' }}>
              {/* Header: Serif Page Title + Green Action CTA */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent)', lineHeight: '1.1' }}>
                    MARK ATTENDANCE
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Select subject and scan biometric attendance</p>
                </div>
                <button
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--text-on-accent)',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '9999px',
                    fontSize: '0.88rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => setShowScheduleModal(true)}
                >
                  <Calendar size={16} color="var(--text-on-accent)" /> SCHEDULE CLASS
                </button>
              </div>

              {scheduleSuccessMsg && (
                <div style={{ padding: '12px 16px', background: 'var(--accent-green-light)', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '16px', marginBottom: '1.2rem', fontSize: '0.88rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} /> {scheduleSuccessMsg}
                </div>
              )}

              {subjects.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>Please add a subject first under "Manage Subject".</p>
              ) : (
                <>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Select Subject</label>
                  <select
                    className="input-field"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                  >
                    {subjects.map((s) => (
                      <option key={s.subject_id} value={s.subject_id}>
                        {s.subject_code} - {s.name} (Sec {s.section})
                      </option>
                    ))}
                  </select>

                  {/* 3-Way Mode Toggle Selector inside Dark Input Bar */}
                  <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
                    <div style={{
                      display: 'inline-flex',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      padding: '6px',
                      borderRadius: '9999px',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
                    }}>
                      <button
                        style={{
                          background: attendanceSubTab === 'upload' ? 'var(--accent)' : 'transparent',
                          color: attendanceSubTab === 'upload' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                          border: 'none',
                          padding: '10px 22px',
                          borderRadius: '9999px',
                          fontSize: '0.88rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={() => { setAttendanceSubTab('upload'); stopCamera(); }}
                      >
                        📸 Group Photos
                      </button>
                      <button
                        style={{
                          background: attendanceSubTab === 'camera' ? 'var(--accent)' : 'transparent',
                          color: attendanceSubTab === 'camera' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                          border: 'none',
                          padding: '10px 22px',
                          borderRadius: '9999px',
                          fontSize: '0.88rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={() => { setAttendanceSubTab('camera'); startCamera(); }}
                      >
                        📹 Live Camera
                      </button>
                      <button
                        style={{
                          background: attendanceSubTab === 'voice' ? 'var(--accent)' : 'transparent',
                          color: attendanceSubTab === 'voice' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                          border: 'none',
                          padding: '10px 22px',
                          borderRadius: '9999px',
                          fontSize: '0.88rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={() => { setAttendanceSubTab('voice'); stopCamera(); }}
                      >
                        🎙️ Voice Scan
                      </button>
                    </div>
                  </div>

                  {/* Sub-tab 1: Upload */}
                  {attendanceSubTab === 'upload' && (
                    <div>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                        Upload up to 5 photos of the classroom to detect and recognize all student faces.
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="input-field"
                        onChange={(e) => setSelectedPhotos(Array.from(e.target.files))}
                      />

                      {selectedPhotos.length > 0 && (
                        <div style={{ margin: '1rem 0' }}>
                          <p style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '600', marginBottom: '0.5rem' }}>Selected Photos ({selectedPhotos.length}):</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px', marginBottom: '1.2rem' }}>
                            {selectedPhotos.map((file, idx) => (
                              <div key={idx} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '2px solid #4f46e5', height: '95px' }}>
                                <img src={URL.createObjectURL(file)} alt={`Upload ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15,23,42,0.8)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', color: '#fff', fontWeight: '700' }}>
                                  #{idx+1}
                                </span>
                              </div>
                            ))}
                          </div>

                          {errorMsg && (
                            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                              <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                              {errorMsg}
                            </div>
                          )}

                          <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600', marginRight: '1rem' }}>Scan Mode:</label>
                          <label style={{ fontSize: '0.85rem', marginRight: '1rem', cursor: 'pointer', color: '#0f172a' }}>
                            <input type="radio" name="scan_mode" value="quick" checked={scanMode === 'quick'} onChange={() => setScanMode('quick')} /> Quick Scan (HOG)
                          </label>
                          <label style={{ fontSize: '0.85rem', cursor: 'pointer', color: '#0f172a' }}>
                            <input type="radio" name="scan_mode" value="deep" checked={scanMode === 'deep'} onChange={() => setScanMode('deep')} /> Deep Scan (CNN)
                          </label>
                          <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={handleGroupPhotoAnalyze} disabled={loading}>
                            {loading ? 'Analyzing Photos...' : 'Analyze Photos'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-tab 2: Live Camera */}
                  {attendanceSubTab === 'camera' && (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                        Capture a picture of the classroom using your webcam.
                      </p>
                      <div style={{ margin: '0 auto 1rem auto', width: '100%', maxWidth: '480px', height: '320px', background: '#0f172a', borderRadius: '14px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <button className="btn-primary" style={{ maxWidth: '300px', margin: '0 auto' }} onClick={captureCameraScan} disabled={loading || !cameraActive}>
                        {loading ? 'Scanning Frame...' : 'Capture & Analyze'}
                      </button>
                    </div>
                  )}

                  {/* Sub-tab 3: Voice Recognition */}
                  {attendanceSubTab === 'voice' && (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                        Record students calling out attendance to verify audio embeddings.
                      </p>

                      {/* Live animated waveform equalizer while recording */}
                      {recordingVoice && (
                        <div>
                          <div className="waveform-container">
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: '600', marginBottom: '1rem' }}>🎙️ Recording audio live... Speak clearly</p>
                        </div>
                      )}

                      {/* Recorded Audio Player */}
                      {recordedVoiceUrl && !recordingVoice && (
                        <div style={{ margin: '1.2rem auto', background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', maxWidth: '440px' }}>
                          <p style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: '700', marginBottom: '0.6rem' }}>🎧 Listen to Recorded Audio:</p>
                          <audio controls src={recordedVoiceUrl} style={{ width: '100%', outline: 'none' }} />
                        </div>
                      )}

                      {errorMsg && (
                        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '8px', margin: '1rem auto', maxWidth: '440px', fontSize: '0.85rem' }}>
                          <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                          {errorMsg}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
                        {!recordingVoice ? (
                          <button className="btn-primary" style={{ maxWidth: '240px' }} onClick={startVoiceRecording}>
                            <Mic size={18} /> {recordedVoiceUrl ? 'Re-record Audio' : 'Start Recording Voice'}
                          </button>
                        ) : (
                          <button className="btn-secondary" style={{ maxWidth: '240px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }} onClick={stopVoiceRecording}>
                            Stop Recording
                          </button>
                        )}

                        {recordedVoiceBlob && !recordingVoice && (
                          <button className="btn-primary" style={{ maxWidth: '240px', background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)' }} onClick={handleAnalyzeVoice} disabled={loading}>
                            {loading ? 'Analyzing Voice...' : 'Analyze Voice Recording'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Results & Attendance Review Table */}
                  {detectedStudents.length > 0 && (
                    <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', color: '#0d9488', fontWeight: '800' }}>Recognized Students ({detectedStudents.length})</h4>
                      <table className="styled-table">
                        <thead>
                          <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Detection Source</th>
                            <th>Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detectedStudents.map((s, idx) => (
                            <tr key={idx}>
                              <td>{s.student_id}</td>
                              <td><strong>{s.name}</strong></td>
                              <td>{s.sources ? s.sources.join(', ') : s.source}</td>
                              <td>{(s.confidence * 100).toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className="btn-secondary" onClick={() => setDetectedStudents([])}>Discard</button>
                        <button className="btn-primary" onClick={handleConfirmLog} disabled={loading}>
                          {loading ? 'Saving Records...' : 'Confirm & Save Attendance'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Log Summary Output */}
                  {attendanceSummary && (
                    <div style={{ marginTop: '2rem', background: '#ccfbf1', border: '1px solid #99f6e4', padding: '1.5rem', borderRadius: '14px' }}>
                      <h4 style={{ color: '#0d9488', marginBottom: '1rem', fontWeight: '800' }}>🎉 Attendance Logged Successfully</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                          <h5 style={{ color: '#0d9488', fontWeight: '700' }}>✅ Present ({attendanceSummary.present.length})</h5>
                          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', fontSize: '0.9rem', color: '#0f172a' }}>
                            {attendanceSummary.present.map((name, i) => <li key={i}>{name}</li>)}
                          </ul>
                        </div>
                        <div>
                          <h5 style={{ color: '#ef4444', fontWeight: '700' }}>❌ Absent ({attendanceSummary.absent.length})</h5>
                          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                            {attendanceSummary.absent.map((name, i) => <li key={i}>{name}</li>)}
                          </ul>
                        </div>
                      </div>
                      <button className="btn-secondary" style={{ marginTop: '1rem', background: '#ffffff' }} onClick={() => setAttendanceSummary(null)}>Close Summary</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: MANAGE SUBJECT */}
          {activeTab === 'manage_subject' && (
            <div className="glass-card" style={{ background: 'var(--bg-card)', borderRadius: '28px', border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: '800' }}>
                <BookOpen color="var(--accent)" /> Existing Subjects
              </h3>

              {subjects.length > 0 ? (
                <table className="styled-table" style={{ marginBottom: '2rem', width: '100%', color: 'var(--text-primary)' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px' }}>Subject Code</th>
                      <th style={{ padding: '10px' }}>Course Name</th>
                      <th style={{ padding: '10px' }}>Section</th>
                      <th style={{ padding: '10px' }}>Enrolled Students</th>
                      <th style={{ padding: '10px' }}>Classes Held</th>
                      <th style={{ padding: '10px' }}>QR Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((sub) => (
                      <tr key={sub.subject_id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 10px', color: 'var(--accent)' }}><strong>{sub.subject_code}</strong></td>
                        <td style={{ padding: '12px 10px' }}>{sub.name}</td>
                        <td style={{ padding: '12px 10px' }}>{sub.section}</td>
                        <td style={{ padding: '12px 10px' }}>{sub.enrolled_count}</td>
                        <td style={{ padding: '12px 10px' }}>{sub.classes_held}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setSelectedQRSubject(sub)}
                          >
                            <QrCode size={14} /> Generate QR
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>No subjects registered yet.</p>
              )}

              <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: '700' }}>Register New Subject</h4>
              <form onSubmit={handleAddSubject}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Subject Code</label>
                    <input className="input-field" placeholder="e.g. CS101" value={newSubCode} onChange={(e) => setNewSubCode(e.target.value)} required />
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Section</label>
                    <input className="input-field" placeholder="e.g. A" value={newSubSection} onChange={(e) => setNewSubSection(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Course Name</label>
                    <input className="input-field" placeholder="e.g. Data Structures" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', maxWidth: '240px', background: 'var(--accent)', color: 'var(--text-on-accent)', fontWeight: '800' }}>
                  <Plus size={18} color="var(--text-on-accent)" /> Add Subject
                </button>
              </form>

              {selectedQRSubject && (
                <QRModal subject={selectedQRSubject} onClose={() => setSelectedQRSubject(null)} />
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE RECORDS */}
          {activeTab === 'attendance_record' && (
            <div className="glass-card" style={{ background: 'var(--bg-card)', borderRadius: '28px', border: '1px solid var(--border)', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.25)' }}>
              <h3 style={{ fontFamily: "'Times New Roman', Times, serif", marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: '800', fontSize: '1.6rem' }}>
                <BarChart2 color="var(--accent)" /> ATTENDANCE RECORDS
              </h3>

              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Select Subject</label>
              <select
                className="input-field"
                style={{ marginBottom: '1.5rem' }}
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_code} - {s.name} (Sec {s.section})
                  </option>
                ))}
              </select>

              <AttendanceTable
                records={records}
                subjectCode={subjects.find((s) => String(s.subject_id) === String(selectedSubjectId))?.subject_code || ''}
              />
            </div>
          )}

          {/* Schedule Class Light Theme Modal */}
          {showScheduleModal && (
            <ScheduleModal
              subjects={subjects}
              initialSubjectId={selectedSubjectId}
              onClose={() => setShowScheduleModal(false)}
              onScheduleSuccess={(scheduleData) => {
                setScheduleSuccessMsg(`Class scheduled for ${scheduleData.subjectLabel} on ${scheduleData.date} (${scheduleData.startTime} - ${scheduleData.endTime})`);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
