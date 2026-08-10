import React from 'react';
import { Camera, ArrowLeft } from 'lucide-react';

export default function Header({ currentScreen, onNavigateHome }) {
  const isHome = currentScreen === 'home';

  return (
    <header className="snap-header">
      <div className="snap-header-brand">
        <div className="snap-header-logo">
          <Camera size={22} color="#ffffff" />
        </div>
        <div>
          <div className="snap-header-title">Snap Class</div>
          <div className="snap-header-sub">AI Biometric Attendance</div>
        </div>
      </div>

      {!isHome && (
        <button className="nav-link-btn" onClick={onNavigateHome}>
          <ArrowLeft size={16} /> Home
        </button>
      )}
    </header>
  );
}
