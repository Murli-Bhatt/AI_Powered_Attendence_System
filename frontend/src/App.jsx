import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import HomeScreen from './screens/HomeScreen';
import TeacherScreen from './screens/TeacherScreen';
import StudentScreen from './screens/StudentScreen';

// Helpers to safely restore session state from localStorage on page refresh
const getInitialTeacher = () => {
  try {
    const saved = localStorage.getItem('snapclass_teacher');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

const getInitialStudentId = () => {
  return localStorage.getItem('snapclass_student_id') || null;
};

const getInitialScreen = () => {
  const teacher = getInitialTeacher();
  const student = getInitialStudentId();
  const savedScreen = localStorage.getItem('snapclass_screen');
  if (teacher) return savedScreen || 'teacher';
  if (student) return savedScreen || 'student';
  return savedScreen || 'home';
};

const getInitialTab = () => {
  return localStorage.getItem('snapclass_tab') || 'take_attendance';
};

export default function App() {
  const [teacher, setTeacher] = useState(getInitialTeacher);
  const [studentId, setStudentId] = useState(getInitialStudentId);
  const [currentScreen, setCurrentScreen] = useState(getInitialScreen); // 'home' | 'teacher' | 'student'
  const [activeTab, setActiveTab] = useState(getInitialTab); // 'take_attendance' | 'manage_subject' | 'attendance_record'
  const [initialSubjectCode, setInitialSubjectCode] = useState('');

  // Active Theme State: 'light' | 'dark' | 'sunset'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('snapclass_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('snapclass_theme', theme);
  }, [theme]);

  // Sync navigation & session state to localStorage
  useEffect(() => {
    localStorage.setItem('snapclass_screen', currentScreen);
  }, [currentScreen]);

  useEffect(() => {
    localStorage.setItem('snapclass_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (teacher) {
      localStorage.setItem('snapclass_teacher', JSON.stringify(teacher));
    } else {
      localStorage.removeItem('snapclass_teacher');
    }
  }, [teacher]);

  useEffect(() => {
    if (studentId) {
      localStorage.setItem('snapclass_student_id', studentId);
    } else {
      localStorage.removeItem('snapclass_student_id');
    }
  }, [studentId]);

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
    localStorage.removeItem('snapclass_teacher');
    localStorage.removeItem('snapclass_screen');
    setCurrentScreen('home');
  };

  const handleStudentLogout = () => {
    setStudentId(null);
    localStorage.removeItem('snapclass_student_id');
    localStorage.removeItem('snapclass_screen');
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
          onNavigateHome={() => handleNavigate('home')}
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
                setCurrentScreen('teacher');
              }}
              onLogout={handleTeacherLogout}
              onSwitchToStudent={() => handleNavigate('student')}
            />
          )}

          {currentScreen === 'student' && (
            <StudentScreen
              initialSubjectCode={initialSubjectCode}
              studentId={studentId}
              onStudentLogin={(sId) => {
                setStudentId(sId);
                setTeacher(null);
                setCurrentScreen('student');
              }}
              onStudentLogout={handleStudentLogout}
            />
          )}
        </main>
      </div>
    </div>
  );
}
