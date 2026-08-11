import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import HomeScreen from './screens/HomeScreen';
import TeacherScreen from './screens/TeacherScreen';
import StudentScreen from './screens/StudentScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'teacher' | 'student'
  const [activeTab, setActiveTab] = useState('take_attendance'); // 'take_attendance' | 'manage_subject' | 'attendance_record'
  const [initialSubjectCode, setInitialSubjectCode] = useState('');

  // Active Theme State: 'light' | 'dark' | 'sunset'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('snapclass_theme') || 'light';
  });

  // Active Role Session State
  const [teacher, setTeacher] = useState(null);
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('snapclass_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Parse QR code deep links: ?action=enroll&subject_code=CS101
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const code = params.get('subject_code');

    if (action === 'enroll' || code) {
      if (code) setInitialSubjectCode(code);
      setCurrentScreen('student');
    }
  }, []);

  const handleNavigate = (screen, tab = 'take_attendance') => {
    setCurrentScreen(screen);
    if (tab) setActiveTab(tab);
  };

  const handleTeacherLogout = () => {
    setTeacher(null);
    setCurrentScreen('home');
  };

  const handleStudentLogout = () => {
    setStudentId(null);
    setCurrentScreen('home');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--text-primary)', transition: 'background 0.3s ease' }}>
      {/* Persistent Left-Hand Navigation Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        teacher={teacher}
        studentId={studentId}
        onLogoutTeacher={handleTeacherLogout}
        onLogoutStudent={handleStudentLogout}
        theme={theme}
      />

      {/* Main Layout Area - Reduced Top Padding to eliminate top gap */}
      <div style={{ flex: 1, padding: '0.5rem 1.5rem 1.5rem 1.5rem', overflowY: 'auto' }}>
        {/* Top Utility Header with Theme Change Options */}
        <TopHeader
          currentScreen={currentScreen}
          onNavigateHome={() => setCurrentScreen('home')}
          teacher={teacher}
          studentId={studentId}
          onLogout={() => {
            if (teacher) handleTeacherLogout();
            if (studentId) handleStudentLogout();
          }}
          theme={theme}
          onThemeChange={setTheme}
        />

        {/* Dynamic View Router */}
        <main>
          {currentScreen === 'home' && (
            <HomeScreen
              onSelectPortal={(portal) => handleNavigate(portal, 'take_attendance')}
              teacher={teacher}
              studentId={studentId}
              onTeacherLoginSuccess={(tData) => {
                setTeacher(tData);
                setStudentId(null);
                setCurrentScreen('teacher');
              }}
              onStudentLoginSuccess={(sId) => {
                setStudentId(sId);
                setTeacher(null);
                setCurrentScreen('student');
              }}
            />
          )}

          {currentScreen === 'teacher' && (
            <TeacherScreen
              initialTab={activeTab}
              teacher={teacher}
              onLoginSuccess={(teacherData) => {
                setTeacher(teacherData);
                setStudentId(null);
              }}
              onLogout={handleTeacherLogout}
              onSwitchToStudent={() => setCurrentScreen('student')}
            />
          )}

          {currentScreen === 'student' && (
            <StudentScreen
              initialSubjectCode={initialSubjectCode}
              studentId={studentId}
              onStudentLogin={(sId) => {
                setStudentId(sId);
                setTeacher(null);
              }}
              onStudentLogout={handleStudentLogout}
            />
          )}
        </main>
      </div>
    </div>
  );
}
