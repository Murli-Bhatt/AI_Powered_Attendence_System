import React from 'react';
import { GraduationCap, UserCheck, ShieldCheck, Zap, BarChart2, Camera } from 'lucide-react';

export default function HomeScreen({ onSelectPortal }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      {/* Hero Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          background: 'rgba(108, 92, 231, 0.15)',
          border: '1px solid rgba(108, 92, 231, 0.3)',
          borderRadius: '50px',
          color: '#a78bfa',
          fontSize: '0.75rem',
          fontWeight: '600',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginBottom: '1.2rem'
        }}>
          ✨ Powered by FastAPI & React AI
        </div>

        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: '900',
          lineHeight: '1.1',
          marginBottom: '1rem',
          letterSpacing: '-1.5px'
        }}>
          Attendance,<br />
          <span style={{
            background: 'linear-gradient(135deg, #6C5CE7, #a855f7, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Reimagined.</span>
        </h1>

        <p style={{
          fontSize: '1rem',
          color: 'rgba(255,255,255,0.5)',
          maxWidth: '480px',
          margin: '0 auto 2.5rem auto',
          lineHeight: '1.7'
        }}>
          Next-generation face & voice biometric attendance platform built for high-speed accuracy.
        </p>
      </div>

      {/* Portals Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        maxWidth: '750px',
        margin: '0 auto 3rem auto'
      }}>
        {/* Teacher Portal */}
        <div className="glass-card" style={{
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(108, 92, 231, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.2rem auto'
            }}>
              <GraduationCap size={30} color="#a855f7" />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem' }}>Teacher Portal</h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Manage subjects, process group photo scans, and track records.
            </p>
          </div>
          <button className="btn-primary" onClick={() => onSelectPortal('teacher')}>
            ENTER TEACHER PORTAL →
          </button>
        </div>

        {/* Student Portal */}
        <div className="glass-card" style={{
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(0, 184, 148, 0.2), rgba(85, 239, 196, 0.2))',
              border: '1px solid rgba(0, 184, 148, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.2rem auto'
            }}>
              <UserCheck size={30} color="#55efc4" />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem' }}>Student Portal</h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Face ID authentication, instant biometric enrollment, and history.
            </p>
          </div>
          <button
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #00b894, #00cec9)' }}
            onClick={() => onSelectPortal('student')}
          >
            ENTER STUDENT PORTAL →
          </button>
        </div>
      </div>

      {/* Feature Pills */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 16px', borderRadius: '50px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Camera size={14} color="#a855f7" /> Face Recognition
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 16px', borderRadius: '50px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BarChart2 size={14} color="#55efc4" /> Real-time Analytics
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 16px', borderRadius: '50px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="#74b9ff" /> Biometric Security
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 16px', borderRadius: '50px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={14} color="#ffeaa7" /> Instant Matching
        </div>
      </div>
    </div>
  );
}
