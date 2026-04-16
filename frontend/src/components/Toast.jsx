// src/components/Toast.jsx
import React, { useEffect } from 'react';

const TOAST_COLORS = {
  success: { bg: 'rgba(0,255,136,0.12)', border: 'rgba(0,255,136,0.3)', text: '#00ff88', icon: '✓' },
  error:   { bg: 'rgba(255,0,64,0.12)',  border: 'rgba(255,0,64,0.3)',  text: '#ff0040', icon: '✕' },
  warning: { bg: 'rgba(255,195,0,0.12)', border: 'rgba(255,195,0,0.3)', text: '#ffc300', icon: '⚠' },
  info:    { bg: 'rgba(0,194,255,0.12)', border: 'rgba(0,194,255,0.3)', text: '#00c2ff', icon: 'ℹ' },
};

export default function Toast({ message, type = 'info', onClose, duration = 3500 }) {
  const config = TOAST_COLORS[type] || TOAST_COLORS.info;

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div style={{
      position:       'fixed',
      bottom:         `calc(var(--nav-height) + 20px + var(--safe-bottom))`,
      left:           '50%',
      transform:      'translateX(-50%)',
      zIndex:         9999,
      maxWidth:       '360px',
      width:          'calc(100% - 40px)',
      background:     config.bg,
      border:         `1px solid ${config.border}`,
      backdropFilter: 'blur(16px)',
      borderRadius:   '14px',
      padding:        '14px 18px',
      display:        'flex',
      alignItems:     'center',
      gap:            '12px',
      animation:      'slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      boxShadow:      '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <span style={{
        fontSize:   '20px',
        color:      config.text,
        fontWeight: 700,
        lineHeight: 1,
        minWidth:   '24px',
        textAlign:  'center',
      }}>
        {config.icon}
      </span>
      <p style={{
        flex:       1,
        fontSize:   '14px',
        fontWeight: 600,
        color:      '#f0f0ff',
        fontFamily: 'var(--font-display)',
        margin:     0,
        lineHeight: 1.4,
      }}>
        {message}
      </p>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          color:      'var(--text-muted)',
          fontSize:   '18px',
          padding:    '2px 6px',
          borderRadius: '6px',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => e.target.style.color = '#f0f0ff'}
        onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
      >
        ×
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Toast hook for easy use
// ─────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = React.useState(null);

  const showToast = React.useCallback((message, type = 'info') => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const hideToast = React.useCallback(() => setToast(null), []);

  const ToastComponent = toast ? (
    <Toast
      key={toast.key}
      message={toast.message}
      type={toast.type}
      onClose={hideToast}
    />
  ) : null;

  return { showToast, ToastComponent };
}
