import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function AttendanceTable({ records = [], subjectCode = '' }) {
  const [filterTerm, setFilterTerm] = useState('');

  // Filter records based on student name, subject code, or status
  const filteredRecords = records.filter((r) => {
    const term = filterTerm.toLowerCase();
    const nameMatch = (r.student_name || '').toLowerCase().includes(term);
    const idMatch = String(r.student_id || '').toLowerCase().includes(term);
    const subMatch = (r.subject_code || subjectCode || '').toLowerCase().includes(term);
    const statusMatch = (r.status || 'present').toLowerCase().includes(term);
    return nameMatch || idMatch || subMatch || statusMatch;
  });

  return (
    <div>
      {/* Top Filter & Search Field using Full Pill Border */}
      <div style={{ position: 'relative', marginBottom: '1.2rem', maxWidth: '380px' }}>
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Filter logs by student name, ID, or mode..."
          value={filterTerm}
          onChange={(e) => setFilterTerm(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            borderRadius: '9999px',
            padding: '10px 16px 10px 44px',
            fontSize: '0.88rem',
            color: 'var(--text-primary)',
            outline: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        />
      </div>

      {/* Institutional Grid Data Table */}
      <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)', textAlign: 'left' }}>
          {/* Header Bar */}
          <thead style={{ background: 'var(--primary-navy)', color: '#ffffff' }}>
            <tr>
              <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                SUBJECT CODE
              </th>
              <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                STUDENT NAME
              </th>
              <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                DETECTION MODE
              </th>
              <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                STATUS
              </th>
              <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                DATE / TIME
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--input-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                >
                  {/* Subject Code with explicit vertical border */}
                  <td style={{ padding: '14px 18px', fontSize: '0.88rem', fontWeight: '800', color: 'var(--primary-navy)', borderRight: '1px solid var(--border-color)' }}>
                    {row.subject_code || subjectCode || 'CS101'}
                  </td>

                  {/* Student Name with explicit vertical border */}
                  <td style={{ padding: '14px 18px', fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)', borderRight: '1px solid var(--border-color)' }}>
                    {row.student_name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400' }}>(ID: {row.student_id})</span>
                  </td>

                  {/* Detection Mode with explicit vertical border */}
                  <td style={{ padding: '14px 18px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '600', borderRight: '1px solid var(--border-color)' }}>
                    {row.mode || '📸 Biometric AI Scan'}
                  </td>

                  {/* Real-Time Status Badge with explicit vertical border */}
                  <td style={{ padding: '14px 18px', borderRight: '1px solid var(--border-color)' }}>
                    {row.status === 'absent' ? (
                      <span style={{
                        background: '#ffebee',
                        color: '#c62828',
                        padding: '4px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: '800'
                      }}>
                        🔴 ABSENT
                      </span>
                    ) : (
                      <span style={{
                        background: 'var(--accent-green-light)',
                        color: 'var(--accent-green)',
                        padding: '4px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: '800'
                      }}>
                        🟢 PRESENT
                      </span>
                    )}
                  </td>

                  {/* Date & Time Timestamp */}
                  <td style={{ padding: '14px 18px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    {row.timestamp || new Date().toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No attendance records found matching filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
