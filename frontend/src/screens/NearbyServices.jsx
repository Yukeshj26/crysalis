// src/screens/NearbyServices.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const SERVICE_TYPES = [
  { id: 'hospital',    label: 'Hospital',  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
  ), primaryType: 'hospital',     color: '#00c2ff', bg: 'rgba(0,194,255,0.06)',   border: 'rgba(0,194,255,0.2)' },
  { id: 'police',      label: 'Police',    icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z"/></svg>
  ), primaryType: 'police',        color: '#5b8cff', bg: 'rgba(91,140,255,0.06)',  border: 'rgba(91,140,255,0.2)' },
  { id: 'fire_station',label: 'Fire',      icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2c0 0-7 7-7 13a7 7 0 0 0 14 0c0-4-3-8-3-8s-1 3-4 4c0 0 1-5 0-9z"/></svg>
  ), primaryType: 'fire_station',   color: '#ff5a5a', bg: 'rgba(255,90,90,0.06)',  border: 'rgba(255,90,90,0.2)' },
  { id: 'pharmacy',    label: 'Pharmacy',  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
  ), primaryType: 'pharmacy',       color: '#00e87a', bg: 'rgba(0,232,122,0.06)',  border: 'rgba(0,232,122,0.2)' },
];

// Dark ultra-minimal map style
const MAP_STYLES = [
  { elementType: 'geometry',           stylers: [{ color: '#080a0e' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#3d4560' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#080a0e' }] },
  { featureType: 'road',               elementType: 'geometry',   stylers: [{ color: '#0e1118' }] },
  { featureType: 'road',               elementType: 'geometry.stroke', stylers: [{ color: '#161b26' }] },
  { featureType: 'road.arterial',      elementType: 'labels.text.fill', stylers: [{ color: '#2a3050' }] },
  { featureType: 'road.highway',       elementType: 'geometry',   stylers: [{ color: '#161b26' }] },
  { featureType: 'road.highway',       elementType: 'geometry.stroke', stylers: [{ color: '#1e2535' }] },
  { featureType: 'road.highway',       elementType: 'labels.text.fill', stylers: [{ color: '#3d4560' }] },
  { featureType: 'poi',                elementType: 'geometry',   stylers: [{ color: '#0b0e16' }] },
  { featureType: 'poi',                elementType: 'labels.text.fill', stylers: [{ color: '#2a3050' }] },
  { featureType: 'poi.park',           elementType: 'geometry',   stylers: [{ color: '#0a0f0a' }] },
  { featureType: 'water',              elementType: 'geometry',   stylers: [{ color: '#050710' }] },
  { featureType: 'water',              elementType: 'labels.text.fill', stylers: [{ color: '#1a2040' }] },
  { featureType: 'transit',            elementType: 'geometry',   stylers: [{ color: '#0b0e16' }] },
  { featureType: 'landscape',          elementType: 'geometry',   stylers: [{ color: '#080a0e' }] },
  { featureType: 'administrative',     elementType: 'geometry.stroke', stylers: [{ color: '#1e2535' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#3d4560' }] },
];

export default function NearbyServices({ showToast }) {
  const mapRef       = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef   = useRef([]);

  const [location,    setLocation]    = useState(null);
  const [mapsLoaded,  setMapsLoaded]  = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [searching,   setSearching]   = useState(false);
  const [error,       setError]       = useState('');
  const [activeType,  setActiveType]  = useState('hospital');
  const [places,      setPlaces]      = useState([]);
  const [selected,    setSelected]    = useState(null);

  const activeConfig = SERVICE_TYPES.find((s) => s.id === activeType);

  /* Load Google Maps */
  useEffect(() => {
    if (!MAPS_API_KEY) { setError('Missing Google Maps API Key'); setLoading(false); return; }
    const loader = new Loader({ apiKey: MAPS_API_KEY, version: 'weekly', libraries: ['places'] });
    loader.load().then(() => setMapsLoaded(true)).catch(() => { setError('Failed to load Google Maps'); setLoading(false); });
  }, []);

  /* Get location */
  useEffect(() => {
    if (!mapsLoaded) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLoading(false); },
      ()    => { setLocation({ lat: 13.0827, lng: 80.2707 }); setLoading(false); }
    );
  }, [mapsLoaded]);

  /* Init map */
  useEffect(() => {
    if (!location || !mapsLoaded || googleMapRef.current) return;
    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: location, zoom: 14,
      disableDefaultUI: true,
      zoomControl: false,
      styles: MAP_STYLES,
    });
    // Custom "you are here" marker
    new window.google.maps.Marker({
      position: location,
      map: googleMapRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#00c2ff',
        fillOpacity: 1,
        strokeColor: 'rgba(0,194,255,0.3)',
        strokeWeight: 10,
      },
      title: 'You are here',
    });
  }, [location, mapsLoaded]);

  /* Search nearby */
  const searchNearby = useCallback(async (type) => {
    if (!googleMapRef.current || !location) return;
    setSearching(true);
    setPlaces([]);
    setSelected(null);
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    try {
      const config = SERVICE_TYPES.find((x) => x.id === type);
      const { Place, SearchNearbyRankPreference } = await window.google.maps.importLibrary('places');
      const request = {
        fields: ['displayName', 'location', 'formattedAddress', 'rating'],
        locationRestriction: {
          center: new window.google.maps.LatLng(location.lat, location.lng),
          radius: 5000,
        },
        includedPrimaryTypes: [config.primaryType],
        maxResultCount: 9,
        rankPreference: SearchNearbyRankPreference.DISTANCE,
      };
      const { places: results = [] } = await Place.searchNearby(request);
      const normalized = results.map((p) => ({
        name:    p.displayName,
        address: p.formattedAddress,
        rating:  p.rating || 0,
        lat:     p.location.lat(),
        lng:     p.location.lng(),
      }));
      setPlaces(normalized);

      normalized.forEach((place, idx) => {
        const marker = new window.google.maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          map: googleMapRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: config.color,
            fillOpacity: 0.9,
            strokeColor: config.color,
            strokeWeight: 2,
          },
          label: {
            text: `${idx + 1}`,
            color: '#080a0e',
            fontSize: '9px',
            fontWeight: 'bold',
          },
        });
        markersRef.current.push(marker);
      });
    } catch (err) {
      setError('Nearby search failed');
    }
    setSearching(false);
  }, [location]);

  useEffect(() => { if (location) searchNearby(activeType); }, [location]);

  const handleTabClick = (type) => { setActiveType(type); searchNearby(type); };

  const openNavigation = (place) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`, '_blank');
  };

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ animation: 'spin 1s linear infinite' }}>
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
      </svg>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>LOCATING YOU</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#ff5a5a', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{error}</p>
    </div>
  );

  return (
    <div style={{ padding: '32px', paddingBottom: '40px', minHeight: '100dvh', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fade-in 0.4s ease' }}>

      {/* ── HEADER ── */}
      <div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '6px' }}>EMERGENCY PROXIMITY</p>
        <h1 style={{ fontSize: '30px', letterSpacing: '-0.02em', marginBottom: '4px' }}>Nearby Services</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
          Emergency help near your live location
        </p>
      </div>

      {/* ── SERVICE TYPE TABS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
        {SERVICE_TYPES.map((item) => {
          const isActive = activeType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              style={{
                background: isActive ? item.bg : 'var(--bg-surface)',
                border: `1px solid ${isActive ? item.border.replace('0.2)', '0.5)') : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '14px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                color: isActive ? item.color : 'var(--text-muted)',
                transition: '0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {isActive && (
                <span style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                  background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`,
                }} />
              )}
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', fontWeight: 600 }}>
                {item.label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── MAP ── */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div ref={mapRef} style={{ width: '100%', height: '320px' }} />

        {/* Map overlay — top info bar */}
        <div style={{
          position: 'absolute', top: '12px', left: '12px', right: '12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(8,10,14,0.85)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${activeConfig?.border || 'var(--border)'}`,
            borderRadius: '8px',
            padding: '7px 12px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ color: activeConfig?.color, display: 'flex' }}>{activeConfig?.icon}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
              {searching ? 'SEARCHING...' : `${places.length} ${activeConfig?.label?.toUpperCase()} FOUND`}
            </span>
          </div>

          {/* Zoom controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', pointerEvents: 'all' }}>
            {['+', '−'].map((z) => (
              <button key={z} onClick={() => {
                const curr = googleMapRef.current?.getZoom() || 14;
                googleMapRef.current?.setZoom(z === '+' ? curr + 1 : curr - 1);
              }} style={{
                width: '30px', height: '30px',
                background: 'rgba(8,10,14,0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 300, lineHeight: 1,
              }}>{z}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PLACE GRID (3 per row) ── */}
      {searching ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em' }}>SCANNING AREA</span>
        </div>
      ) : places.length > 0 && (
        <>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
            RESULTS — {places.length} LOCATIONS
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
            {places.map((place, index) => {
              const isSel = selected === index;
              return (
                <div
                  key={index}
                  onClick={() => setSelected(isSel ? null : index)}
                  style={{
                    background: isSel ? activeConfig?.bg : 'var(--bg-surface)',
                    border: `1px solid ${isSel ? activeConfig?.border.replace('0.2)', '0.5)') : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    cursor: 'pointer',
                    transition: '0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Index badge */}
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    width: '18px', height: '18px',
                    borderRadius: '50%',
                    background: activeConfig?.color || 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: 700,
                    color: '#080a0e',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {index + 1}
                  </div>

                  <p style={{
                    fontSize: '12px', fontWeight: 700,
                    color: isSel ? activeConfig?.color : 'var(--text-primary)',
                    lineHeight: 1.3,
                    paddingRight: '24px',
                  }}>
                    {place.name}
                  </p>

                  <p style={{
                    fontSize: '10px', color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {place.address}
                  </p>

                  {place.rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffc300" stroke="#ffc300" strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#ffc300' }}>{place.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Navigate button — expands on select */}
                  {isSel && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openNavigation(place); }}
                      style={{
                        marginTop: '4px',
                        padding: '8px',
                        background: activeConfig?.color,
                        border: 'none',
                        borderRadius: '8px',
                        color: '#080a0e',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#080a0e" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                      NAVIGATE
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}