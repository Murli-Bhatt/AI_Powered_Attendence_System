import React, { useState, useEffect, useRef } from 'react';
import { UserCheck, Camera, Mic, LogOut, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import {
  authenticateStudentFace,
  registerStudent,
  getStudentAttendanceSummary,
  getSubjectByCode,
  enrollStudent
} from '../api/client';

export default function StudentScreen({ initialSubjectCode = '' }) {
  const [step, setStep] = useState('capture'); // 'capture' | 'register' | 'dashboard'
  const [studentId, setStudentId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
      setErrorMsg("Unable to access camera: " + err.message);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
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

  // Handle Face ID Scan
  const handleFaceScan = async () => {
    if (!videoRef.current) return;
    setLoading(true);
    setErrorMsg('');

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg');

    canvas.toBlob(async (blob) => {
      try {
        const res = await authenticateStudentFace(blob);
        if (res.success) {
          setStudentId(res.student_id);
          setStep('dashboard');
        } else if (res.face_encoding) {
          setTempFaceEncoding(res.face_encoding);
          setTempFacePreview(dataUrl);
          setStep('register');
        } else {
          setErrorMsg(res.error || "No clear face detected.");
        }
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }, 'image/jpeg');
  };

  // Handle Voice Recording for Registration
  const startVoiceRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setVoiceBlob(blob);
        setRecordingVoice(false);
      };

      mediaRecorder.start();
      setRecordingVoice(true);
    } catch (err) {
      alert("Microphone access failed: " + err.message);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  // Complete Registration
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !tempFaceEncoding) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await registerStudent(studentName, tempFaceEncoding, voiceBlob);
      if (res.success && res.data && res.data[0]) {
        setStudentId(res.data[0].student_id);
        setStep('dashboard');
      } else {
        setErrorMsg("Registration failed.");
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Attendance Summary on Dashboard
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
    if (step === 'dashboard' && studentId) {
      loadSummary(studentId);
    }
  }, [step, studentId]);

  // Handle Enrollment
  const handleEnrollSubject = async (e) => {
    e.preventDefault();
    if (!enrollSubjectCode.trim()) return;
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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(0, 184, 148, 0.2), rgba(85, 239, 196, 0.2))',
          border: '1px solid rgba(0, 184, 148, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <UserCheck size={26} color="#55efc4" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Student Portal</h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
            {studentId ? `Student ID: ${studentId}` : 'Biometric Face ID Scan'}
          </p>
        </div>
      </div>

      {/* STEP 1: FACE ID CAPTURE */}
      {step === 'capture' && (
        <div className="glass-card" style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ color: '#55efc4', marginBottom: '0.5rem' }}>📷 Face ID Authentication</h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
            Position your face clearly in the camera view
          </p>

          {errorMsg && (
            <div style={{ padding: '10px', background: 'rgba(255, 118, 117, 0.15)', border: '1px solid rgba(255, 118, 117, 0.3)', color: '#ff7675', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
              {errorMsg}
            </div>
          )}

          <div style={{ width: '100%', height: '300px', background: '#000', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <button className="btn-primary" onClick={handleFaceScan} disabled={loading || !cameraActive}>
            {loading ? 'Authenticating...' : 'Authenticate Face ID'}
          </button>
        </div>
      )}

      {/* STEP 2: STUDENT REGISTRATION */}
      {step === 'register' && (
        <div className="glass-card" style={{ maxWidth: '520px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#55efc4' }}>📝 New Student Registration</h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
            Your face was captured. Enter your details to complete registration.
          </p>

          {tempFacePreview && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img src={tempFacePreview} alt="Face Preview" style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #55efc4' }} />
            </div>
          )}

          <form onSubmit={handleCompleteRegistration}>
            <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Full Name</label>
            <input className="input-field" placeholder="e.g. John Doe" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />

            <div style={{ margin: '1rem 0' }}>
              <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
                <input type="checkbox" checked={enrollVoice} onChange={(e) => setEnrollVoice(e.target.checked)} style={{ marginRight: '8px' }} />
                Optional: Enroll Voice Print
              </label>
            </div>

            {enrollVoice && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.8rem' }}>Please say your name clearly:</p>
                {!recordingVoice ? (
                  <button type="button" className="btn-secondary" style={{ maxWidth: '240px', margin: '0 auto' }} onClick={startVoiceRecording}>
                    <Mic size={16} /> Record Voice
                  </button>
                ) : (
                  <button type="button" className="btn-secondary" style={{ maxWidth: '240px', margin: '0 auto', background: 'rgba(255, 118, 117, 0.2)', color: '#ff7675' }} onClick={stopVoiceRecording}>
                    Stop Recording
                  </button>
                )}
                {voiceBlob && <p style={{ fontSize: '0.75rem', color: '#55efc4', marginTop: '6px' }}>✓ Audio recorded!</p>}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setStep('capture')}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Enrolling...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: STUDENT DASHBOARD */}
      {step === 'dashboard' && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen color="#55efc4" /> Enroll in a Course
          </h3>

          <form onSubmit={handleEnrollSubject} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <input
              className="input-field"
              style={{ margin: 0 }}
              placeholder="Enter Subject Code (e.g. CS101)"
              value={enrollSubjectCode}
              onChange={(e) => setEnrollSubjectCode(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ width: '160px' }}>Enroll</button>
          </form>

          {enrollMsg && (
            <p style={{ fontSize: '0.85rem', color: '#55efc4', marginBottom: '1.5rem' }}>{enrollMsg}</p>
          )}

          <h4 style={{ marginBottom: '1rem' }}>📊 My Attendance Summary</h4>
          {summary.length > 0 ? (
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th>Total Classes</th>
                  <th>Attended</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong>{item["Subject Code"]}</strong></td>
                    <td>{item["Subject Name"]}</td>
                    <td>{item["Total Classes Held"]}</td>
                    <td>{item["Classes Attended"]}</td>
                    <td><span className="badge-present">{item["Attendance %"]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>You are not enrolled in any subjects yet.</p>
          )}

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button className="btn-secondary" style={{ maxWidth: '200px', margin: '0 auto' }} onClick={() => { setStudentId(null); setStep('capture'); }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
