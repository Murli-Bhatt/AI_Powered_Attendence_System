import React, { useState } from 'react';
import { Bell, Sun, User, LogOut, Moon, Home, Flame, Check, Sparkles } from 'lucide-react';

export default function TopHeader({
  currentScreen,
  onNavigateHome,
  teacher,
  studentId,
  onLogout,
  theme = 'emerald',
  onThemeChange = () => {}
}) {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon size={18} color="var(--accent)" />;
    if (theme === 'sunset') return <Flame size={18} color="var(--accent)" />;
    if (theme === 'light') return <Sun size={18} color="var(--accent)" />;
    return <Sparkles size={18} color="var(--accent)" />;
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      padding: '0.8rem 1.5rem',
      background: 'var(--header-bg)',
      border: '1px solid var(--border)',
      borderRadius: '24px',
      marginBottom: '1rem',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.2)',
      gap: '1rem',
      transition: 'all 0.3s ease'
    }}>
      {/* LEFT SIDE: Institutional System Badge Pill */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--bg-input)',
        border: '1px solid var(--border)',
        padding: '6px 16px 6px 8px',
        borderRadius: '9999px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'var(--bg-card)',
          border: '2px solid var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          {teacher || studentId ? (
            <User size={18} color="var(--accent)" />
          ) : (
            <img
              src="/thdc-logo.png"
              alt="THDC-IHET Seal"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </div>
        <div>
          <p style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--accent)', lineHeight: '1.1' }}>
            {teacher ? teacher.name : studentId ? `Student #${studentId}` : 'THDC-IHET Institutional System'}
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--accent-light)', fontWeight: '700' }}>
            {teacher ? '● Faculty Logged In' : studentId ? '● Face ID Verified' : '● System Ready'}
          </p>
        </div>

        {(teacher || studentId) && (
          <button
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              paddingLeft: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>

      {/* RIGHT SIDE CONTROLS: Theme Switcher Popover, Notifications, then Right-Most Home Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
        {/* Interactive Theme Selector Button with Dropdown Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowNotifications(false);
            }}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--accent)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            title="Choose Theme: Emerald, Light, Dark, or Sunset"
          >
            {getThemeIcon()}
          </button>

          {/* Theme Options Popover Dropdown */}
          {showThemeMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '50px',
              width: '240px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
              padding: '8px',
              zIndex: 200
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                SELECT APP THEME
              </p>

              {/* Option 1: Emerald Matrix */}
              <button
                onClick={() => {
                  onThemeChange('emerald');
                  setShowThemeMenu(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: theme === 'emerald' ? 'var(--bg-input)' : 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#22c55e" /> Emerald Matrix
                </span>
                {theme === 'emerald' && <Check size={16} color="#22c55e" />}
              </button>

              {/* Option 2: Institutional Light */}
              <button
                onClick={() => {
                  onThemeChange('light');
                  setShowThemeMenu(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: theme === 'light' ? 'var(--bg-input)' : 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sun size={16} color="#2e3075" /> Institutional Light
                </span>
                {theme === 'light' && <Check size={16} color="#00c853" />}
              </button>

              {/* Option 3: Sleek Dark Mode */}
              <button
                onClick={() => {
                  onThemeChange('dark');
                  setShowThemeMenu(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: theme === 'dark' ? 'var(--bg-input)' : 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Moon size={16} color="#38bdf8" /> Sleek Dark Mode
                </span>
                {theme === 'dark' && <Check size={16} color="#38bdf8" />}
              </button>

              {/* Option 4: Sunset Orange */}
              <button
                onClick={() => {
                  onThemeChange('sunset');
                  setShowThemeMenu(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: theme === 'sunset' ? 'var(--bg-input)' : 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flame size={16} color="#f97316" /> Sunset Orange
                </span>
                {theme === 'sunset' && <Check size={16} color="#f97316" />}
              </button>
            </div>
          )}
        </div>

        {/* Notification Icon with Emerald Status Badge */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowThemeMenu(false);
            }}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            title="System Notifications"
          >
            <Bell size={18} color="var(--text-secondary)" />
          </button>

          {/* Active Status Indicator Badge */}
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '10px',
            height: '10px',
            background: 'var(--accent)',
            borderRadius: '50%',
            border: '2px solid var(--header-bg)'
          }}></span>

          {/* Notification Dropdown Popover */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '50px',
              width: '260px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              padding: '12px 16px',
              zIndex: 100
            }}>
              <p style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--accent)', marginBottom: '6px' }}>System Notifications</p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '6px 0', borderTop: '1px solid var(--border)' }}>
                🟢 THDC-IHET Attendance Server active & synchronized.
              </div>
            </div>
          )}
        </div>

        {/* RIGHT-MOST HOME NAVIGATION BUTTON */}
        {currentScreen !== 'home' && (
          <button
            onClick={onNavigateHome}
            style={{
              background: 'var(--accent)',
              color: 'var(--text-on-accent)',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '9999px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            <Home size={16} /> Home
          </button>
        )}
      </div>
    </header>
  );
}
