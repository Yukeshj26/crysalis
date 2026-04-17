// src/components/Sidebar.jsx
import React, { useState } from 'react';

const NAV_ITEMS = [
  {
    id: 'sos',
    label: 'RESPOND',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'nearby',
    label: 'NEARBY',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
  },
];

export default function Sidebar({ activeTab, onTabChange, isOnline }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

      {/* FLOATING TOGGLE BUTTON */}
      <button
        className="sidebar-toggle floating"
        onClick={() => setCollapsed(!collapsed)}
      >
        <svg
          className={`toggle-icon ${collapsed ? 'rotated' : ''}`}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* LOGO */}
      <div className="sidebar-logo">
        <img src="/logo.png" alt="logo" className="sidebar-logo-img" />
        {!collapsed && (
          <div className="sidebar-brand">
            <span className="brand-title">CRYSALIS</span>
            <span className="brand-sub">Crisis Response</span>
          </div>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* NAV */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const active = activeTab === item.id;
          const isSOS = item.id === 'sos';

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`nav-item ${active ? 'active' : ''} ${isSOS ? 'sos' : ''}`}
              title={collapsed ? item.label : ''}
            >
              {active && <span className={`active-bar ${isSOS ? 'fire' : 'blue'}`} />}

              <span className="icon">{item.icon}</span>

              {!collapsed && <span className="label">{item.label}</span>}

              {isSOS && <span className="pulse-dot" />}
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="sidebar-footer">
        <div className="status">
          <span className={`dot ${isOnline ? 'online' : 'offline'}`} />
          {!collapsed && <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>}
        </div>
      </div>

    </aside>
  );
}