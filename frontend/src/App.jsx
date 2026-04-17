// src/App.jsx
import React, { useState, useEffect } from 'react';
import './styles/global.css';

import Sidebar        from './components/Sidebar';
import OfflineBanner  from './components/OfflineBanner';
import { useToast }   from './components/Toast';

import SOSScreen      from './screens/SOSScreen';
import StaffDashboard from './screens/StaffDashboard';
import NearbyServices from './screens/NearbyServices';

import { syncQueue } from './services/offlineQueue';
import {
  initNotifications,
  listenForegroundMessages
} from './firebase/notifications';

export default function App() {
  const [activeTab, setActiveTab] = useState('sos');
  const [isOnline, setIsOnline]   = useState(navigator.onLine);
  const [syncing, setSyncing]           = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      showToast('Back online — syncing...', 'success');
      setSyncing(true);
      try {
        const result = await syncQueue();
        if (result?.total > 0) showToast(`Synced ${result.synced} incident(s) ✓`, 'success');
      } catch (err) {
        showToast('Sync failed', 'error');
      }
      setTimeout(() => { setSyncing(false); setSyncProgress(null); }, 1200);
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline — incidents will be queued', 'warning');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    try {
      initNotifications?.().then((token) => {
        if (token) console.log('[FCM] Token ready');
      });
      const unsub = listenForegroundMessages?.(({ title, body }) => {
        showToast(`${title}: ${body}`, 'info');
      });
      return () => unsub && unsub();
    } catch (err) {
      console.warn('[FCM] Not configured yet');
    }
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'sos':       return <SOSScreen isOnline={isOnline} showToast={showToast} />;
      case 'dashboard': return <StaffDashboard showToast={showToast} />;
      case 'nearby':    return <NearbyServices showToast={showToast} />;
      default:          return <SOSScreen isOnline={isOnline} showToast={showToast} />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOnline={isOnline} />

      <div className="app-content">
        <OfflineBanner isOnline={isOnline} syncing={syncing} syncProgress={syncProgress} />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingTop: (!isOnline || syncing) ? '44px' : '0',
            transition: 'padding-top 0.3s ease',
          }}
        >
          {renderScreen()}
        </main>
      </div>

      {ToastComponent}
    </div>
  );
}