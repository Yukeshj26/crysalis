// src/components/Sidebar.jsx
import React from 'react';

const NAV_ITEMS = [
  {
    id: 'sos',
    label: 'RESPOND',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  {
    id: 'dashboard',
    label: 'COMMAND',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'nearby',
    label: 'NEARBY',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
  },
];

export default function Sidebar({ activeTab, onTabChange, isOnline }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" stroke="#ff4500" strokeWidth="1.5" fill="none"/>
            <circle cx="12" cy="12" r="3" fill="#ff4500"/>
            <line x1="12" y1="2" x2="12" y2="9" stroke="#ff4500" strokeWidth="1.5"/>
            <line x1="12" y1="15" x2="12" y2="22" stroke="#ff4500" strokeWidth="1.5"/>
          </svg>
        </div>
        <div className="sidebar-brand">
          <span className="sidebar-brand-name">CRYSALIS</span>
          <span className="sidebar-brand-sub">Crisis Response</span>
        </div>
      </div>

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Nav Items */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const isSOS = item.id === 'sos';

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''} ${isSOS ? 'sos-nav' : ''}`}
            >
              {/* Active bar */}
              {isActive && <span className={`sidebar-active-bar ${isSOS ? 'fire' : 'blue'}`} />}

              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>

              {isSOS && (
                <span className="sidebar-sos-dot" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div className="sidebar-footer">
        <div className="sidebar-divider" />
        <div className="sidebar-status">
          <span className={`sidebar-status-dot ${isOnline ? 'online' : 'offline'}`} />
          <span className="sidebar-status-label">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
        <div className="sidebar-version">v2.1.0</div>
      </div>
    </aside>
  );
}