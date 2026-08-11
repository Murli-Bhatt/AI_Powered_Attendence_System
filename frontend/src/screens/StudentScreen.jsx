import React, { useState, useEffect, useRef } from 'react';
import { UserCheck, Mic, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import {
  authenticateStudentFace,
  registerStudent,
  getStudentAttendanceSummary,
  getSubjectByCode,
  enrollStudent
} from '../api/client';

export default function StudentScreen({
  initialSubjectCode = '',
  studentId: externalStudentId = null,
  onStudentLogin = () => {},
  onStudentLogout = () => {}
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
    if (step === 'capture') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step]);

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
    }
  }, [studentId]);

  // Handle Face ID Authentication
  const handleFaceScan = async () => {
    if (!videoRef.current) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
      const file = new File([blob], 'student_scan.jpg', { type: 'image/jpeg' });

      const res = await authenticateStudentFace(file);
      if (res.success) {
        if (res.matched) {
          const sId = res.student_id;
          setStudentId(sId);
          onStudentLogin(sId);
          setStep('dashboard');
        } else {
          setTempFaceEncoding(res.face_encoding);
          setTempFacePreview(canvas.toDataURL('image/jpeg'));
          setStep('register');
        }
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
        const newStudentId = res.student_id;
        setStudentId(newStudentId);
        onStudentLogin(newStudentId);
        setStep('dashboard');
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
            Position your face clearly in the camera view
          </p>

          {errorMsg && (
            <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
              {errorMsg}
            </div>
          )}

          <div style={{ width: '100%', height: '300px', background: '#000000', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <button className="btn-primary" style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', fontWeight: '800', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)' }} onClick={handleFaceScan} disabled={loading || !cameraActive}>
            {loading ? 'Authenticating...' : 'Authenticate Face ID'}
          </button>
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
        </div>
      )}

      {/* STEP 3: STUDENT DASHBOARD */}
      {step === 'dashboard' && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent)' }}>My Attendance Dashboard</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Registered Student ID: #{studentId}</p>
            </div>

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
        </div>
      )}
    </div>
  );
}
