import React, { useState, useEffect, useRef } from 'react';
import { UserCheck, Mic, BookOpen, CheckCircle, AlertCircle, Bell, Calendar, Clock, X } from 'lucide-react';
import {
  authenticateStudentFace,
  registerStudent,
  getStudentAttendanceSummary,
  getSubjectByCode,
  enrollStudent,
  getStudentSchedules
} from '../api/client';

export default function StudentScreen({
  initialSubjectCode = '',
  studentId: externalStudentId = null,
  onStudentLogin = () => {},
  onStudentLogout = () => {},
  onNotificationsUpdate = () => {}
}) {
  const [studentId, setStudentId] = useState(externalStudentId);
  const [step, setStep] = useState(externalStudentId ? 'dashboard' : 'capture');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (externalStudentId) {
      setStudentId(externalStudentId);
      setStep('dashboard');
    }
  }, [externalStudentId]);

  // Temp face registration state
  const [tempFaceEncoding, setTempFaceEncoding] = useState(null);
  const [tempFacePreview, setTempFacePreview] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [capturedFramePreview, setCapturedFramePreview] = useState(null);

  // Voice optional state
  const [enrollVoice, setEnrollVoice] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Dashboard & Enrollment State
  const [summary, setSummary] = useState([]);
  const [enrollSubjectCode, setEnrollSubjectCode] = useState(initialSubjectCode);
  const [enrollMsg, setEnrollMsg] = useState('');

  // Class Schedule Notifications State
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [showNoticePopup, setShowNoticePopup] = useState(false);
  const [showNoticeDropdown, setShowNoticeDropdown] = useState(false);

  const filterActiveSchedules = (schedulesList = []) => {
    const now = new Date();
    return schedulesList.filter((s) => {
      try {
        let scheduleDate = new Date(s.date);
        if (isNaN(scheduleDate.getTime())) {
          scheduleDate = new Date();
        }
        
        const [endH, endM] = (s.end_time || '23:59').split(':').map(Number);
        const classEnd = new Date(scheduleDate);
        classEnd.setHours(endH, endM, 59, 999);

        // Schedule is valid ONLY up until the scheduled class end time!
        return now <= classEnd;
      } catch (e) {
        return true;
      }
    });
  };

  const loadStudentSchedules = async (sId) => {
    try {
      const res = await getStudentSchedules(sId);
      if (res.success && res.data) {
        const activeList = filterActiveSchedules(res.data);
        setActiveNotifications(activeList);
        onNotificationsUpdate(activeList);
        if (activeList.length > 0) {
          setShowNoticePopup(true);
        }
      }
    } catch (err) {
      console.error("Error loading student schedules:", err);
    }
  };

  useEffect(() => {
    if (initialSubjectCode) {
      setEnrollSubjectCode(initialSubjectCode);
    }
  }, [initialSubjectCode]);

  // Camera Reference
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Camera access denied or unavailable.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (step === 'capture' && !capturedFramePreview) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, capturedFramePreview]);

  // Load summary for student
  const loadSummary = async (sId) => {
    try {
      const res = await getStudentAttendanceSummary(sId);
      if (res.success) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (studentId) {
      loadSummary(studentId);
      loadStudentSchedules(studentId);
    }
  }, [studentId]);

  const handleRetakePhoto = () => {
    setCapturedFramePreview(null);
    setErrorMsg('');
    startCamera();
  };

  // Handle Face ID Authentication with Frame Freeze
  const handleFaceScan = async () => {
    if (!videoRef.current && !capturedFramePreview) return;
    setLoading(true);
    setErrorMsg('');

    try {
      let blob;
      let frameDataUrl;

      if (!capturedFramePreview) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        frameDataUrl = canvas.toDataURL('image/jpeg');
        // Freeze frame image on screen immediately
        setCapturedFramePreview(frameDataUrl);
        // Stop live stream so camera freezes on captured frame
        stopCamera();

        blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
      } else {
        // Convert existing dataURL back to blob if retrying
        const res = await fetch(capturedFramePreview);
        blob = await res.blob();
      }

      const file = new File([blob], 'student_scan.jpg', { type: 'image/jpeg' });

      // Calls backend endpoint which uses trained SVM classifier
      const res = await authenticateStudentFace(file);
      if (res.success) {
        // Successfully recognized face by SVM
        const sId = res.student_id;
        setStudentId(sId);
        onStudentLogin(sId);
        setStep('dashboard');
      } else if (res.face_encoding) {
        // Not recognized, but got encoding -> move to registration
        setTempFaceEncoding(res.face_encoding);
        setTempFacePreview(capturedFramePreview || tempFacePreview);
        setStep('register');
      } else {
        setErrorMsg(res.error || 'Face not recognized. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Face authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Voice Recording
  const startRecordingVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setVoiceBlob(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setRecordingVoice(true);
    } catch (err) {
      setErrorMsg('Microphone access denied or unavailable.');
    }
  };

  const stopRecordingVoice = () => {
    if (mediaRecorderRef.current && recordingVoice) {
      mediaRecorderRef.current.stop();
      setRecordingVoice(false);
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await registerStudent(
        studentName.trim(),
        tempFaceEncoding,
        enrollVoice ? voiceBlob : null
      );

      if (res.success) {
        const newStudentId = res.student_id || (res.data && res.data.length > 0 ? res.data[0].student_id : null);
        setStudentId(newStudentId);
        onStudentLogin(newStudentId);
        setStep('dashboard');
      } else {
        setErrorMsg(res.error || 'Student registration failed.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Student registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Quick Enrollment by Subject Code
  const handleEnrollSubject = async (e) => {
    e.preventDefault();
    if (!enrollSubjectCode.trim() || !studentId) return;
    setEnrollMsg('');

    try {
      const subRes = await getSubjectByCode(enrollSubjectCode.trim());
      if (subRes.success) {
        const sub = subRes.data;
        const res = await enrollStudent(studentId, sub.subject_id);
        if (res.success) {
          setEnrollMsg(`Successfully enrolled in ${sub.name}!`);
          setEnrollSubjectCode('');
          loadSummary(studentId);
        }
      }
    } catch (err) {
      setEnrollMsg(err.message);
    }
  };

  return (
    <div style={{ width: '100%', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '14px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <UserCheck size={26} color="var(--accent)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent)' }}>Student Portal</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {studentId ? `Student ID: ${studentId}` : 'Biometric Face ID Scan'}
          </p>
        </div>
      </div>

      {/* STEP 1: FACE ID CAPTURE */}
      {step === 'capture' && (
        <div className="glass-card" style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontWeight: '800' }}>📷 Face ID Authentication</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {capturedFramePreview ? 'Captured snapshot frozen for SVM authentication:' : 'Position your face clearly in the camera view'}
          </p>

          {errorMsg && (
            <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
              {errorMsg}
            </div>
          )}

          <div style={{ width: '100%', height: '300px', background: '#000000', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid var(--border)', position: 'relative' }}>
            {capturedFramePreview ? (
              <img
                src={capturedFramePreview}
                alt="Captured Face Snapshot"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {capturedFramePreview && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '12px 20px', borderRadius: '9999px', fontWeight: '800', fontSize: '0.88rem' }}
                onClick={handleRetakePhoto}
                disabled={loading}
              >
                📸 Retake Photo
              </button>
            )}

            <button
              className="btn-primary"
              style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', fontWeight: '800', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)' }}
              onClick={handleFaceScan}
              disabled={loading || (!cameraActive && !capturedFramePreview)}
            >
              {loading ? 'Authenticating with SVM...' : (capturedFramePreview ? 'Authenticate Photo' : 'Authenticate Face ID')}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: NEW STUDENT REGISTRATION */}
      {step === 'register' && (
        <div className="glass-card" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem', textAlign: 'center', fontWeight: '800' }}>✨ Face ID Not Recognized</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
            Register as a new student to save your facial biometrics.
          </p>

          {tempFacePreview && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img src={tempFacePreview} alt="Face Preview" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
            </div>
          )}

          <form onSubmit={handleRegisterSubmit}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Full Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Alice Smith"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
              style={{ marginBottom: '1.5rem' }}
            />

            {/* Optional Voice Enrollment */}
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={enrollVoice} onChange={(e) => setEnrollVoice(e.target.checked)} />
                Optional: Enable Voice Biometrics
              </label>

              {enrollVoice && (
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Say: <em>"My name is {studentName || 'Student'} and I authorize SnapClass attendance."</em>
                  </p>
                  {!recordingVoice ? (
                    <button type="button" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={startRecordingVoice}>
                      <Mic size={14} /> Record Voice Sample
                    </button>
                  ) : (
                    <button type="button" className="btn-primary" style={{ background: '#ef4444', padding: '6px 14px', fontSize: '0.8rem' }} onClick={stopRecordingVoice}>
                      Stop Recording
                    </button>
                  )}
                  {voiceBlob && <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>✓ Voice sample recorded!</p>}
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', background: 'var(--accent)', color: 'var(--text-on-accent)', fontWeight: '800' }} disabled={loading}>
              {loading ? 'Registering...' : 'Register Student Biometrics'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
            <button
              type="button"
              style={{
                background: 'transparent',
                border: '1.5px solid var(--border)',
                color: 'var(--text-primary)',
                padding: '10px 20px',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                setCapturedFramePreview(null);
                setErrorMsg('');
                setStep('capture');
              }}
            >
              📸 Retake / Re-scan Face ID
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: STUDENT DASHBOARD */}
      {step === 'dashboard' && (
        <div className="glass-card">
          {/* POPUP ALERT MODAL FOR UPCOMING SCHEDULED CLASSES */}
          {showNoticePopup && activeNotifications.length > 0 && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
              padding: '1rem'
            }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '2px solid var(--accent)',
                borderRadius: '20px',
                padding: '1.5rem',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                position: 'relative'
              }}>
                <button
                  onClick={() => setShowNoticePopup(false)}
                  style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: 'var(--accent)' }}>
                  <Bell size={24} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Upcoming Class Alert</h3>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Your teacher has scheduled a class for a subject you are registered in:
                </p>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <table className="styled-table" style={{ width: '100%', fontSize: '0.85rem', margin: 0 }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeNotifications.map((notif, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: '800', color: 'var(--accent)' }}>{notif.subject_label}</td>
                          <td>{notif.date}</td>
                          <td>{notif.start_time} - {notif.end_time}</td>
                          <td>📍 {notif.room || 'Classroom'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => setShowNoticePopup(false)}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem', background: 'var(--accent)', color: 'var(--text-on-accent)', fontWeight: '800' }}
                >
                  Got It, Understood!
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent)' }}>My Attendance Dashboard</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Registered Student ID: #{studentId}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Quick Course Enrollment Form */}
              <form onSubmit={handleEnrollSubject} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter Subject Code (e.g. CS101)"
                  value={enrollSubjectCode}
                  onChange={(e) => setEnrollSubjectCode(e.target.value)}
                  style={{ width: '220px', padding: '8px 14px', fontSize: '0.85rem' }}
                  required
                />
                <button type="submit" className="btn-accent" style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'var(--accent)', color: 'var(--text-on-accent)', fontWeight: '800' }}>
                  <BookOpen size={14} color="var(--text-on-accent)" /> Enroll
                </button>
              </form>
            </div>
          </div>

          {enrollMsg && (
            <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: '700' }}>
              <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
              {enrollMsg}
            </div>
          )}

          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>Enrolled Courses & Records</h4>

          {summary.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '10px' }}>Subject Code</th>
                  <th style={{ padding: '10px' }}>Subject Name</th>
                  <th style={{ padding: '10px' }}>Classes Attended</th>
                  <th style={{ padding: '10px' }}>Total Classes</th>
                  <th style={{ padding: '10px' }}>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: '700', color: 'var(--accent)' }}>{item['Subject Code']}</td>
                    <td style={{ padding: '12px 10px' }}>{item['Subject Name']}</td>
                    <td style={{ padding: '12px 10px' }}>{item['Classes Attended']}</td>
                    <td style={{ padding: '12px 10px' }}>{item['Total Classes Held']}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className="badge-present">
                        {item['Attendance %']}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>You are not enrolled in any subjects yet.</p>
          )}

          {/* UPCOMING SCHEDULED CLASSES TABLE - Displayed persistently in dashboard */}
          <div style={{ marginTop: '2.5rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--accent)', fontWeight: '800' }}>📅 Upcoming Scheduled Classes</h4>
            {activeNotifications.length > 0 ? (
              <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <table className="styled-table" style={{ width: '100%', marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Subject Info</th>
                      <th>Date scheduled</th>
                      <th>Time slot</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeNotifications.map((notif, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: '800', color: 'var(--accent)' }}>{notif.subject_label}</td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{notif.date}</td>
                        <td>
                          <span style={{ background: 'var(--accent-light)', color: '#fff', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '800' }}>
                            {notif.start_time} - {notif.end_time}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>📍 {notif.room || 'Classroom'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', background: 'var(--bg-input)', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                No upcoming classes are scheduled for your enrolled subjects.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
