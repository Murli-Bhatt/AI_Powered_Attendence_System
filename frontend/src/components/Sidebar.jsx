import React from 'react';
import { Camera, LayoutDashboard, CheckSquare, BookOpen, BarChart2, Settings, UserCheck, LogOut, GraduationCap } from 'lucide-react';

export default function Sidebar({
  currentScreen,
  activeTab,
  onNavigate,
  teacher,
  studentId,
  onLogoutTeacher,
  onLogoutStudent
}) {
  return (
    <aside style={{
      width: '260px',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border)',
      padding: '1.75rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      justify: 'space-between',
      minHeight: '100vh',
      flexShrink: 0,
      transition: 'all 0.3s ease'
    }}>
      <div>
        {/* Brand Header Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.2rem', paddingLeft: '6px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-on-accent)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}>
            <Camera size={22} color="var(--text-on-accent)" />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Times New Roman', serif", fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.1' }}>
              SnapClass
            </h2>
            <span style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
              AI Attendance
            </span>
          </div>
        </div>

        {/* ---------------- CASE 1: TEACHER IS LOGGED IN ---------------- */}
        {teacher ? (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '0.8rem', paddingLeft: '12px' }}>
              FACULTY MENU
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Dashboard */}
              <button
                onClick={() => onNavigate('home')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: currentScreen === 'home' ? 'var(--accent)' : 'transparent',
                  color: currentScreen === 'home' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <LayoutDashboard size={18} color={currentScreen === 'home' ? 'var(--text-on-accent)' : 'var(--text-secondary)'} />
                Dashboard
              </button>

              {/* Mark Attendance */}
              <button
                onClick={() => onNavigate('teacher', 'take_attendance')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: currentScreen === 'teacher' && activeTab === 'take_attendance' ? 'var(--accent)' : 'transparent',
                  color: currentScreen === 'teacher' && activeTab === 'take_attendance' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <CheckSquare size={18} color={currentScreen === 'teacher' && activeTab === 'take_attendance' ? 'var(--text-on-accent)' : 'var(--text-secondary)'} />
                Mark Attendance
              </button>

              {/* Manage Subjects */}
              <button
                onClick={() => onNavigate('teacher', 'manage_subject')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: currentScreen === 'teacher' && activeTab === 'manage_subject' ? 'var(--accent)' : 'transparent',
                  color: currentScreen === 'teacher' && activeTab === 'manage_subject' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <BookOpen size={18} color={currentScreen === 'teacher' && activeTab === 'manage_subject' ? 'var(--text-on-accent)' : 'var(--text-secondary)'} />
                Manage Subjects
              </button>

              {/* Attendance Record */}
              <button
                onClick={() => onNavigate('teacher', 'attendance_record')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: currentScreen === 'teacher' && activeTab === 'attendance_record' ? 'var(--accent)' : 'transparent',
                  color: currentScreen === 'teacher' && activeTab === 'attendance_record' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <BarChart2 size={18} color={currentScreen === 'teacher' && activeTab === 'attendance_record' ? 'var(--text-on-accent)' : 'var(--text-secondary)'} />
                Attendance Record
              </button>
            </nav>
          </div>
        ) : studentId ? (
          /* ---------------- CASE 2: STUDENT IS LOGGED IN ---------------- */
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '0.8rem', paddingLeft: '12px' }}>
              STUDENT MENU
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => onNavigate('home')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: currentScreen === 'home' ? 'var(--accent)' : 'transparent',
                  color: currentScreen === 'home' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <LayoutDashboard size={18} color={currentScreen === 'home' ? 'var(--text-on-accent)' : 'var(--text-secondary)'} />
                Dashboard
              </button>

              <button
                onClick={() => onNavigate('student')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: currentScreen === 'student' ? 'var(--accent)' : 'transparent',
                  color: currentScreen === 'student' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <UserCheck size={18} color={currentScreen === 'student' ? 'var(--text-on-accent)' : 'var(--text-secondary)'} />
                My Attendance & Courses
              </button>
            </nav>
          </div>
        ) : (
          /* ---------------- CASE 3: UNAUTHENTICATED PORTAL SELECTION ---------------- */
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '0.8rem', paddingLeft: '12px' }}>
              PORTAL LOGIN
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => onNavigate('home')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: currentScreen === 'home' ? 'var(--accent)' : 'transparent',
                  color: currentScreen === 'home' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <LayoutDashboard size={18} color={currentScreen === 'home' ? 'var(--text-on-accent)' : 'var(--text-secondary)'} />
                Home
              </button>

              <button
                onClick={() => onNavigate('teacher')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: currentScreen === 'teacher' ? 'var(--accent)' : 'transparent',
                  color: currentScreen === 'teacher' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <GraduationCap size={18} color={currentScreen === 'teacher' ? 'var(--text-on-accent)' : 'var(--text-secondary)'} />
                Faculty Portal
              </button>

              <button
                onClick={() => onNavigate('student')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: currentScreen === 'student' ? 'var(--accent)' : 'transparent',
                  color: currentScreen === 'student' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <UserCheck size={18} color={currentScreen === 'student' ? 'var(--text-on-accent)' : 'var(--text-secondary)'} />
                Student Portal
              </button>
            </nav>
          </div>
        )}

        {/* Settings Group */}
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '0.8rem', paddingLeft: '12px' }}>
            SETTINGS
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => alert("Settings panel initialized.")}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                borderRadius: '9999px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Settings size={18} color="var(--text-secondary)" />
              Settings
            </button>
          </nav>
        </div>
      </div>

      {/* User Session Pill & Version Footer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {teacher ? (
          <div style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--accent)' }}>👨‍🏫 {teacher.name}</p>
            <p style={{ fontSize: '0.68rem', color: 'var(--accent-light)', fontWeight: '700', marginBottom: '6px' }}>Faculty Session</p>
            <button
              onClick={onLogoutTeacher}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '0 auto' }}
            >
              <LogOut size={12} /> Logout
            </button>
          </div>
        ) : studentId ? (
          <div style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--accent)' }}>🎓 Student #{studentId}</p>
            <p style={{ fontSize: '0.68rem', color: 'var(--accent-light)', fontWeight: '700', marginBottom: '6px' }}>Face ID Verified</p>
            <button
              onClick={onLogoutStudent}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '0 auto' }}
            >
              <LogOut size={12} /> Logout
            </button>
          </div>
        ) : null}

        <div style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent)' }}>THDC-IHET SnapClass v2.0</p>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>FastAPI + React AI</p>
        </div>
      </div>
    </aside>
  );
}
