import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, X } from 'lucide-react';

export default function QRModal({ subject, onClose }) {
  const [qrUrl, setQrUrl] = useState('');
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : "http://localhost:5173";
  const enrollmentUrl = `${baseUrl}/?action=enroll&subject_code=${subject.subject_code}`;

  useEffect(() => {
    QRCode.toDataURL(enrollmentUrl, { width: 300, margin: 2 })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error(err));
  }, [subject, enrollmentUrl]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-card" style={{ maxWidth: '420px', width: '100%', position: 'relative' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <h3 style={{ marginBottom: '0.5rem', color: '#fff' }}>🖨️ Course QR Code</h3>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.2rem' }}>
          {subject.name} ({subject.subject_code}) - Sec {subject.section}
        </p>

        {qrUrl && (
          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <img src={qrUrl} alt="Subject QR Code" style={{ borderRadius: '12px', width: '220px', height: '220px' }} />
          </div>
        )}

        <p style={{ fontSize: '0.8rem', color: '#c084fc', marginBottom: '1rem', wordBreak: 'break-all' }}>
          Encoded Link: <code>{enrollmentUrl}</code>
        </p>

        {qrUrl && (
          <a
            href={qrUrl}
            download={`QR_${subject.subject_code}.png`}
            className="btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <Download size={18} /> Download QR Image
          </a>
        )}
      </div>
    </div>
  );
}
