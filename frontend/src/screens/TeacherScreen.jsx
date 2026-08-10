import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap, Camera, Mic, BookOpen, BarChart2,
  LogOut, Plus, CheckCircle, AlertCircle, QrCode, Upload
} from 'lucide-react';
import {
  loginTeacher, registerTeacher, getTeacherSubjects, createSubject,
  uploadGroupPhotos, uploadLiveCamera, uploadVoiceRecognition,
  logAttendanceRecords, getAttendanceRecords
} from '../api/client';
import QRModal from '../components/QRModal';

export default function TeacherScreen() {
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'dashboard'
  const [teacher, setTeacher] = useState(null);

  // Auth Form State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', username: '', password: '', confirmPassword: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dashboard State
  const [activeTab, setActiveTab] = useState('take_attendance'); // 'take_attendance' | 'manage_subject' | 'attendance_record'
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
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.2), rgba(168, 85, 247, 0.2))',
          border: '1px solid rgba(108, 92, 231, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <GraduationCap size={26} color="#a855f7" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Teacher Portal</h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
            {teacher ? `Logged in as ${teacher.name}` : 'Authentication Required'}
          </p>
        </div>
      </div>

      {/* Auth Screens */}
      {authView !== 'dashboard' ? (
        <div style={{ maxWidth: '420px', margin: '0 auto' }}>
          <div className="glass-card">
            {errorMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(255, 118, 117, 0.15)', border: '1px solid rgba(255, 118, 117, 0.3)', color: '#ff7675', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(85, 239, 196, 0.15)', border: '1px solid rgba(85, 239, 196, 0.3)', color: '#55efc4', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                {successMsg}
              </div>
            )}

            {authView === 'login' ? (
              <form onSubmit={handleLogin}>
                <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Login to Account</h3>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Username</label>
                <input
                  className="input-field"
                  placeholder="Enter username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                />
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Login</button>
                <div style={{ textAlign: 'center', margin: '1.5rem 0 1rem 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>OR</div>
                <button type="button" className="btn-secondary" onClick={() => { setErrorMsg(''); setAuthView('register'); }}>Create New Account</button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Create Account</h3>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Full Name</label>
                <input className="input-field" placeholder="e.g. John Doe" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} required />
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Username</label>
                <input className="input-field" placeholder="Choose a username" value={regForm.username} onChange={(e) => setRegForm({ ...regForm, username: e.target.value })} required />
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Password</label>
                <input type="password" className="input-field" placeholder="Create a password" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} required />
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Confirm Password</label>
                <input type="password" className="input-field" placeholder="Repeat password" value={regForm.confirmPassword} onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })} required />
                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Register</button>
                <div style={{ textAlign: 'center', margin: '1.5rem 0 1rem 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>OR</div>
                <button type="button" className="btn-secondary" onClick={() => { setErrorMsg(''); setAuthView('login'); }}>Back to Login</button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* Teacher Dashboard Hub */
        <div>
          {/* Top Feature Navigation Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <button
              className={activeTab === 'take_attendance' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveTab('take_attendance')}
            >
              <Camera size={18} /> Take Attendance
            </button>
            <button
              className={activeTab === 'manage_subject' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveTab('manage_subject')}
            >
              <BookOpen size={18} /> Manage Subject
            </button>
            <button
              className={activeTab === 'attendance_record' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveTab('attendance_record')}
            >
              <BarChart2 size={18} /> Attendance Records
            </button>
          </div>

          {/* TAB 1: TAKE ATTENDANCE */}
          {activeTab === 'take_attendance' && (
            <div className="glass-card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera color="#a855f7" /> Take Attendance
              </h3>

              {subjects.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>Please add a subject first under "Manage Subject".</p>
              ) : (
                <>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Select Subject</label>
                  <select
                    className="input-field"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                  >
                    {subjects.map((s) => (
                      <option key={s.subject_id} value={s.subject_id} style={{ background: '#121218', color: '#fff' }}>
                        {s.subject_code} - {s.name} (Sec {s.section})
                      </option>
                    ))}
                  </select>

                  {/* Sub-tabs for Photo / Live / Voice */}
                  <div style={{ display: 'flex', gap: '10px', margin: '1.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                    <button
                      style={{ background: 'transparent', border: 'none', color: attendanceSubTab === 'upload' ? '#a855f7' : 'rgba(255,255,255,0.6)', fontWeight: '600', cursor: 'pointer', borderBottom: attendanceSubTab === 'upload' ? '2px solid #a855f7' : 'none', paddingBottom: '6px' }}
                      onClick={() => { setAttendanceSubTab('upload'); stopCamera(); }}
                    >
                      📸 Group Photo Upload
                    </button>
                    <button
                      style={{ background: 'transparent', border: 'none', color: attendanceSubTab === 'camera' ? '#a855f7' : 'rgba(255,255,255,0.6)', fontWeight: '600', cursor: 'pointer', borderBottom: attendanceSubTab === 'camera' ? '2px solid #a855f7' : 'none', paddingBottom: '6px' }}
                      onClick={() => { setAttendanceSubTab('camera'); startCamera(); }}
                    >
                      📷 Live Camera
                    </button>
                    <button
                      style={{ background: 'transparent', border: 'none', color: attendanceSubTab === 'voice' ? '#a855f7' : 'rgba(255,255,255,0.6)', fontWeight: '600', cursor: 'pointer', borderBottom: attendanceSubTab === 'voice' ? '2px solid #a855f7' : 'none', paddingBottom: '6px' }}
                      onClick={() => { setAttendanceSubTab('voice'); stopCamera(); }}
                    >
                      🎤 Voice Recognition
                    </button>
                  </div>

                  {/* Sub-tab 1: Upload */}
                  {attendanceSubTab === 'upload' && (
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
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
                          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>Selected Photos ({selectedPhotos.length}):</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px', marginBottom: '1.2rem' }}>
                            {selectedPhotos.map((file, idx) => (
                              <div key={idx} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '2px solid rgba(168, 85, 247, 0.5)', height: '95px' }}>
                                <img src={URL.createObjectURL(file)} alt={`Upload ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', color: '#fff', fontWeight: '600' }}>
                                  #{idx+1}
                                </span>
                              </div>
                            ))}
                          </div>

                          {errorMsg && (
                            <div style={{ padding: '10px 14px', background: 'rgba(255, 118, 117, 0.15)', border: '1px solid rgba(255, 118, 117, 0.3)', color: '#ff7675', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                              <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                              {errorMsg}
                            </div>
                          )}

                          <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginRight: '1rem' }}>Scan Mode:</label>
                          <label style={{ fontSize: '0.85rem', marginRight: '1rem', cursor: 'pointer' }}>
                            <input type="radio" name="scan_mode" value="quick" checked={scanMode === 'quick'} onChange={() => setScanMode('quick')} /> Quick Scan (HOG)
                          </label>
                          <label style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
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
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
                        Capture a picture of the classroom using your webcam.
                      </p>
                      <div style={{ margin: '0 auto 1rem auto', width: '100%', maxWidth: '480px', height: '320px', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
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
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
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
                          <p style={{ fontSize: '0.8rem', color: '#a855f7', marginBottom: '1rem' }}>🎙️ Recording audio live... Speak clearly</p>
                        </div>
                      )}

                      {/* Recorded Audio Player */}
                      {recordedVoiceUrl && !recordingVoice && (
                        <div style={{ margin: '1.2rem auto', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(168,85,247,0.3)', maxWidth: '440px' }}>
                          <p style={{ fontSize: '0.8rem', color: '#a855f7', fontWeight: '600', marginBottom: '0.6rem' }}>🎧 Listen to Recorded Audio:</p>
                          <audio controls src={recordedVoiceUrl} style={{ width: '100%', outline: 'none' }} />
                        </div>
                      )}

                      {errorMsg && (
                        <div style={{ padding: '10px 14px', background: 'rgba(255, 118, 117, 0.15)', border: '1px solid rgba(255, 118, 117, 0.3)', color: '#ff7675', borderRadius: '8px', margin: '1rem auto', maxWidth: '440px', fontSize: '0.85rem' }}>
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
                          <button className="btn-secondary" style={{ maxWidth: '240px', background: 'rgba(255, 118, 117, 0.2)', color: '#ff7675' }} onClick={stopVoiceRecording}>
                            Stop Recording
                          </button>
                        )}

                        {recordedVoiceBlob && !recordingVoice && (
                          <button className="btn-primary" style={{ maxWidth: '240px', background: 'linear-gradient(135deg, #00b894, #00cec9)' }} onClick={handleAnalyzeVoice} disabled={loading}>
                            {loading ? 'Analyzing Voice...' : 'Analyze Voice Recording'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Results & Attendance Review Table */}
                  {detectedStudents.length > 0 && (
                    <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', color: '#55efc4' }}>Recognized Students ({detectedStudents.length})</h4>
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
                    <div style={{ marginTop: '2rem', background: 'rgba(85, 239, 196, 0.05)', border: '1px solid rgba(85, 239, 196, 0.2)', padding: '1.5rem', borderRadius: '14px' }}>
                      <h4 style={{ color: '#55efc4', marginBottom: '1rem' }}>🎉 Attendance Logged Successfully</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                          <h5 style={{ color: '#55efc4' }}>✅ Present ({attendanceSummary.present.length})</h5>
                          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                            {attendanceSummary.present.map((name, i) => <li key={i}>{name}</li>)}
                          </ul>
                        </div>
                        <div>
                          <h5 style={{ color: '#ff7675' }}>❌ Absent ({attendanceSummary.absent.length})</h5>
                          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                            {attendanceSummary.absent.map((name, i) => <li key={i}>{name}</li>)}
                          </ul>
                        </div>
                      </div>
                      <button className="btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setAttendanceSummary(null)}>Close Summary</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: MANAGE SUBJECT */}
          {activeTab === 'manage_subject' && (
            <div className="glass-card">
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen color="#a855f7" /> Existing Subjects
              </h3>

              {subjects.length > 0 ? (
                <table className="styled-table" style={{ marginBottom: '2rem' }}>
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Course Name</th>
                      <th>Section</th>
                      <th>Enrolled Students</th>
                      <th>Classes Held</th>
                      <th>QR Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((sub) => (
                      <tr key={sub.subject_id}>
                        <td><strong>{sub.subject_code}</strong></td>
                        <td>{sub.name}</td>
                        <td>{sub.section}</td>
                        <td>{sub.enrolled_count}</td>
                        <td>{sub.classes_held}</td>
                        <td>
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
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>No subjects registered yet.</p>
              )}

              <h4 style={{ marginBottom: '1rem' }}>Register New Subject</h4>
              <form onSubmit={handleAddSubject}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Subject Code</label>
                    <input className="input-field" placeholder="e.g. CS101" value={newSubCode} onChange={(e) => setNewSubCode(e.target.value)} required />
                    <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Section</label>
                    <input className="input-field" placeholder="e.g. A" value={newSubSection} onChange={(e) => setNewSubSection(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Course Name</label>
                    <input className="input-field" placeholder="e.g. Data Structures" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', maxWidth: '240px' }}>
                  <Plus size={18} /> Add Subject
                </button>
              </form>

              {selectedQRSubject && (
                <QRModal subject={selectedQRSubject} onClose={() => setSelectedQRSubject(null)} />
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE RECORDS */}
          {activeTab === 'attendance_record' && (
            <div className="glass-card">
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 color="#a855f7" /> Attendance Records
              </h3>

              <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Select Subject</label>
              <select
                className="input-field"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id} style={{ background: '#121218', color: '#fff' }}>
                    {s.subject_code} - {s.name}
                  </option>
                ))}
              </select>

              {records.length > 0 ? (
                <table className="styled-table" style={{ marginTop: '1rem' }}>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Student Name</th>
                      <th>Student ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td>{new Date(r.timestamp).toLocaleString()}</td>
                        <td><strong>{r.student_name}</strong></td>
                        <td>{r.student_id}</td>
                        <td><span className="badge-present">✅ Present</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '1.5rem' }}>No attendance records found for this subject.</p>
              )}
            </div>
          )}

          {/* Logout Button */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button className="btn-secondary" style={{ maxWidth: '200px', margin: '0 auto' }} onClick={() => { setTeacher(null); setAuthView('login'); }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
