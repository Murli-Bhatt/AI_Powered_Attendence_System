import React, { useState } from 'react';
import { Camera, Lock, GraduationCap, UserCheck, AlertCircle } from 'lucide-react';
import { loginTeacher } from '../api/client';

export default function HomeScreen({
  onSelectPortal,
  teacher,
  studentId,
  onTeacherLoginSuccess,
  onStudentLoginSuccess
}) {
  const [roleTab, setRoleTab] = useState('faculty'); // 'faculty' | 'student'

  // Faculty Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFacultySubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await loginTeacher(username, password);
      if (res.success) {
        onTeacherLoginSuccess(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '0.5rem 1rem' }}>
      {/* THDC-IHET Institutional Header - Perfectly Centered Directly Above Card */}
      <div style={{ maxWidth: '680px', margin: '0 auto 1.5rem auto', textAlign: 'center' }}>
        {/* Centered Circular Logo Badge */}
        <div style={{
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          background: 'var(--bg-card)',
          border: '3px solid var(--accent)',
          padding: '6px',
          margin: '0 auto 0.8rem auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'none'
        }}>
          <img
            src="/thdc-logo.png"
            alt="THDC Institute of Hydropower Engineering and Technology Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Centered Correct Spelling College Name */}
        <h1 style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '1.45rem',
          fontWeight: '900',
          color: 'var(--accent)',
          letterSpacing: '0.8px',
          lineHeight: '1.25',
          textTransform: 'uppercase',
          marginBottom: '0.4rem'
        }}>
          THDC INSTITUTE OF HYDROPOWER ENGINEERING AND TECHNOLOGY
        </h1>

        <div style={{ fontSize: '0.78rem', color: 'var(--accent-light)', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
          TEHRI GARHWAL | CAMPUS INSTITUTE OF UTU
        </div>

        {/* Subtitle Matching Attendance System */}
        <h2 style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          fontWeight: '700',
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          margin: '0 auto'
        }}>
          AUTOMATED BIOMETRIC ATTENDANCE SYSTEM
        </h2>
      </div>

      {/* SINGLE CENTRAL INSTITUTIONAL CARD WITH UNIFIED EMERALD THEME BACKGROUND */}
      <div style={{ maxWidth: '480px', margin: '0 auto 2rem auto', textAlign: 'left' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '32px',
          padding: '2.25rem 2rem',
          boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.25)',
          color: 'var(--text-primary)',
          transition: 'all 0.3s ease'
        }}>
          {/* Top Role Toggle Switch Pill */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{
              display: 'inline-flex',
              background: 'var(--bg-input)',
              padding: '5px',
              borderRadius: '9999px',
              gap: '4px',
              border: '1px solid var(--border)'
            }}>
              <button
                type="button"
                style={{
                  background: roleTab === 'faculty' ? 'var(--accent)' : 'transparent',
                  color: roleTab === 'faculty' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => setRoleTab('faculty')}
              >
                <GraduationCap size={16} /> FACULTY LOGIN
              </button>
              <button
                type="button"
                style={{
                  background: roleTab === 'student' ? 'var(--accent)' : 'transparent',
                  color: roleTab === 'student' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => setRoleTab('student')}
              >
                <UserCheck size={16} /> STUDENT FACE ID
              </button>
            </div>
          </div>

          {/* DYNAMIC FORM VIEW BASED ON ROLE TAB */}
          {roleTab === 'faculty' ? (
            /* FACULTY LOGIN FORM */
            <form onSubmit={handleFacultySubmit}>
              <h3 style={{
                fontFamily: "'Times New Roman', Times, serif",
                textAlign: 'center',
                marginBottom: '1.5rem',
                color: 'var(--accent)',
                fontWeight: '800',
                fontSize: '1.4rem'
              }}>
                FACULTY AUTHENTICATION
              </h3>

              {errorMsg && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  borderRadius: '14px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  marginBottom: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  FACULTY USERNAME / EMAIL
                </label>
                <input
                  type="text"
                  className="input-field"
                  style={{
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    borderRadius: '9999px',
                    padding: '12px 20px',
                    border: '1px solid var(--border)'
                  }}
                  placeholder="e.g. dr.smith or smith@thdc.edu"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  PASSWORD
                </label>
                <input
                  type="password"
                  className="input-field"
                  style={{
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    borderRadius: '9999px',
                    padding: '12px 20px',
                    border: '1px solid var(--border)'
                  }}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--accent)',
                  color: 'var(--text-on-accent)',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '14px',
                  fontSize: '0.95rem',
                  fontWeight: '800',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Lock size={18} color="var(--text-on-accent)" /> {loading ? 'AUTHENTICATING...' : 'FACULTY LOGIN'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' }}
                  onClick={() => alert("Please contact institutional IT administrator to reset faculty password.")}
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          ) : (
            /* STUDENT FACE ID SCANNER LAUNCHER */
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--bg-input)',
                border: '2px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.2rem auto'
              }}>
                <Camera size={34} color="var(--accent)" />
              </div>

              <h3 style={{
                fontFamily: "'Times New Roman', Times, serif",
                marginBottom: '0.6rem',
                color: 'var(--accent)',
                fontWeight: '800',
                fontSize: '1.4rem'
              }}>
                STUDENT BIOMETRIC PORTAL
              </h3>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.8rem', lineHeight: '1.5' }}>
                Verify your identity using facial recognition or mark biometric attendance for enrolled classes.
              </p>

              <button
                type="button"
                onClick={() => onSelectPortal('student')}
                style={{
                  width: '100%',
                  background: 'var(--accent)',
                  color: 'var(--text-on-accent)',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '14px',
                  fontSize: '0.95rem',
                  fontWeight: '800',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <UserCheck size={18} color="var(--text-on-accent)" /> OPEN STUDENT FACE SCANNER
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
