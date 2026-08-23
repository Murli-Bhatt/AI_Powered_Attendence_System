import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { saveScheduleClass } from '../api/client';

export default function ScheduleModal({ subjects = [], initialSubjectId = '', onClose, onScheduleSuccess }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId || (subjects[0] ? subjects[0].subject_id : ''));
  const today = new Date();
  const currentDay = String(today.getDate());
  const currentMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][today.getMonth()];
  const currentYear = String(today.getFullYear());

  const [day, setDay] = useState(currentDay);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [startTime, setStartTime] = useState('13:30');
  const [endTime, setEndTime] = useState('14:30');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const targetSubject = subjects.find(s => String(s.subject_id) === String(selectedSubjectId));
    const subjectLabel = targetSubject ? `${targetSubject.subject_code} - ${targetSubject.name}` : 'Subject';
    const schedulePayload = {
      subjectId: selectedSubjectId,
      subjectLabel,
      date: `${day} ${month} ${year}`,
      startTime,
      endTime,
      room: "Classroom 301"
    };

    try {
      await saveScheduleClass(schedulePayload);
    } catch (err) {
      console.warn("Saving schedule fallback:", err);
    }

    setLoading(false);
    if (onScheduleSuccess) {
      onScheduleSuccess(schedulePayload);
    }
    onClose();
  };

  const daysList = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const yearsList = ['2026', '2027', '2028'];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      {/* Unified Emerald Card Modal Container */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        width: '100%',
        maxWidth: '540px',
        padding: '2rem',
        boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.4)',
        position: 'relative'
      }}>
        {/* Top Header & Close Icon Button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: '1.75rem',
              fontWeight: '800',
              color: 'var(--accent)',
              margin: 0,
              lineHeight: '1.2'
            }}>
              Schedule class
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
              Pick a subject, date, and time slot.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Schedule Form */}
        <form onSubmit={handleSubmit}>
          {/* Select Subject Dropdown */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Select subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1.5px solid var(--border)',
                borderRadius: '12px',
                padding: '11px 14px',
                fontSize: '0.92rem',
                color: 'var(--text-primary)',
                fontWeight: '600',
                outline: 'none'
              }}
              required
            >
              {subjects.length === 0 ? (
                <option value="">No registered subjects available</option>
              ) : (
                subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_code} - {s.name} (Sec {s.section})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Date Picker Grid */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Date
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>Day</span>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '12px',
                    padding: '10px',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    fontWeight: '600'
                  }}
                >
                  {daysList.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>Month</span>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '12px',
                    padding: '10px',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    fontWeight: '600'
                  }}
                >
                  {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>Year</span>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '12px',
                    padding: '10px',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    fontWeight: '600'
                  }}
                >
                  {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Time Picker Grid */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Time
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>Start time</span>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1.5px solid var(--border)',
                      borderRadius: '12px',
                      padding: '10px 36px 10px 14px',
                      fontSize: '0.92rem',
                      color: 'var(--text-primary)',
                      fontWeight: '700'
                    }}
                    placeholder="09:30"
                    required
                  />
                  <Clock size={16} color="var(--text-secondary)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>End time</span>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1.5px solid var(--border)',
                      borderRadius: '12px',
                      padding: '10px 36px 10px 14px',
                      fontSize: '0.92rem',
                      color: 'var(--text-primary)',
                      fontWeight: '700'
                    }}
                    placeholder="10:30"
                    required
                  />
                  <Clock size={16} color="var(--text-secondary)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Cancel & Schedule */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                border: '1.5px solid var(--border)',
                padding: '10px 22px',
                borderRadius: '9999px',
                fontSize: '0.88rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'var(--accent)',
                color: 'var(--text-on-accent)',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '9999px',
                fontSize: '0.88rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              <Calendar size={16} color="var(--text-on-accent)" /> {loading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
