import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomeScreen from './screens/HomeScreen';
import TeacherScreen from './screens/TeacherScreen';
import StudentScreen from './screens/StudentScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'teacher' | 'student'
  const [initialSubjectCode, setInitialSubjectCode] = useState('');

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

  return (
    <div className="app-container">
      {/* Background Ambient Glow Effects */}
      <div className="glow-purple"></div>
      <div className="glow-green"></div>

      {/* Glassmorphic Navbar */}
      <Header currentScreen={currentScreen} onNavigateHome={() => setCurrentScreen('home')} />

      {/* Screen Router */}
      <main>
        {currentScreen === 'home' && (
          <HomeScreen onSelectPortal={(portal) => setCurrentScreen(portal)} />
        )}
        {currentScreen === 'teacher' && <TeacherScreen />}
        {currentScreen === 'student' && <StudentScreen initialSubjectCode={initialSubjectCode} />}
      </main>
    </div>
  );
}
