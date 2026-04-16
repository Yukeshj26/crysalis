// src/components/OfflineBanner.jsx
import React from 'react';
import { getPendingCount } from '../services/offlineQueue';

export default function OfflineBanner({ isOnline, syncing, syncProgress }) {
  const pending = getPendingCount();

  if (isOnline && !syncing) return null;

  return (
    <div style={{
      position:        'fixed',
      top:             0,
      left:            '50%',
      transform:       'translateX(-50%)',
      width:           '100%',
      maxWidth:        '480px',
      zIndex:          1000,
      background:      isOnline ? 'rgba(0,255,136,0.12)' : 'rgba(255,195,0,0.12)',
      borderBottom:    `1px solid ${isOnline ? 'rgba(0,255,136,0.3)' : 'rgba(255,195,0,0.3)'}`,
      backdropFilter:  'blur(12px)',
      padding:         '10px 20px',
      display:         'flex',
      alignItems:      'center',
      gap:             '10px',
      animation:       'slide-down 0.3s ease',
    }}>
      <span style={{ fontSize: '18px' }}>
        {isOnline ? '🔄' : '📴'}
      </span>
      <div style={{ flex: 1 }}>
        {!isOnline && (
          <p style={{
            fontSize:   '13px',
            fontWeight: 700,
            color:      '#ffc300',
            fontFamily: 'var(--font-display)',
            margin:     0,
          }}>
            OFFLINE MODE — {pending} incident{pending !== 1 ? 's' : ''} queued
          </p>
        )}
        {syncing && (
          <p style={{
            fontSize:   '12px',
            color:      '#00ff88',
            fontFamily: 'var(--font-mono)',
            margin:     0,
          }}>
            Syncing... {syncProgress ? `${syncProgress.synced}/${syncProgress.total}` : ''}
          </p>
        )}
      </div>
      {!isOnline && (
        <span style={{
          fontSize:        '11px',
          fontFamily:      'var(--font-mono)',
          color:           '#ffc300',
          background:      'rgba(255,195,0,0.1)',
          padding:         '3px 8px',
          borderRadius:    '4px',
          border:          '1px solid rgba(255,195,0,0.2)',
          animation:       'pulse-dot 2s ease infinite',
        }}>
          QUEUE
        </span>
      )}
    </div>
  );
}
