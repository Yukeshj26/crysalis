// src/components/BottomNav.jsx
import React from 'react';

const NAV_ITEMS = [
  { id: 'sos',      label: 'SOS',       icon: '🆘' },
  { id: 'dashboard',label: 'Dashboard', icon: '📊' },
  { id: 'nearby',   label: 'Nearby',    icon: '📍' },
];

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav style={{
      position:     'fixed',
      bottom:       0,
      left:         '50%',
      transform:    'translateX(-50%)',
      width:        '100%',
      maxWidth:     '480px',
      height:       'var(--nav-height)',
      background:   'rgba(10,10,15,0.85)',
      backdropFilter:'blur(20px)',
      borderTop:    '1px solid var(--border)',
      display:      'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      zIndex:       100,
      paddingBottom:'var(--safe-bottom)',
    }}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const isSOS    = item.id === 'sos';

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '4px',
              background:     'none',
              padding:        '8px',
              position:       'relative',
              transition:     'all 0.2s ease',
            }}
          >
            {/* Active indicator */}
            {isActive && (
              <span style={{
                position:     'absolute',
                top:          0,
                left:         '50%',
                transform:    'translateX(-50%)',
                width:        '32px',
                height:       '2px',
                background:   isSOS ? '#ff4500' : '#00c2ff',
                borderRadius: '0 0 2px 2px',
                boxShadow:    `0 0 8px ${isSOS ? '#ff4500' : '#00c2ff'}`,
              }} />
            )}

            <span style={{
              fontSize:   isSOS ? '26px' : '22px',
              filter:     isActive ? 'none' : 'grayscale(0.6)',
              opacity:    isActive ? 1 : 0.5,
              transition: 'all 0.2s ease',
              ...(isSOS && isActive ? {
                filter: 'drop-shadow(0 0 8px rgba(255,69,0,0.8))',
                animation: 'pulse-dot 2s ease infinite',
              } : {})
            }}>
              {item.icon}
            </span>
            <span style={{
              fontSize:   '10px',
              fontWeight: isActive ? 700 : 500,
              color:      isActive ? (isSOS ? '#ff4500' : '#00c2ff') : 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.05em',
              transition: 'all 0.2s ease',
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
