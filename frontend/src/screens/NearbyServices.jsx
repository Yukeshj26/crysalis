// src/screens/NearbyServices.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const SERVICE_TYPES = [
  { id: 'hospital',     label: 'Hospitals',     emoji: '🏥', primaryType: 'hospital',      color: '#00c2ff' },
  { id: 'police',       label: 'Police',        emoji: '👮', primaryType: 'police',         color: '#ff4500' },
  { id: 'fire_station', label: 'Fire Stations', emoji: '🚒', primaryType: 'fire_station',   color: '#ffc300' },
  { id: 'pharmacy',     label: 'Pharmacies',    emoji: '💊', primaryType: 'pharmacy',       color: '#00ff88' },
];

export default function NearbyServices({ showToast }) {
  const mapRef        = useRef(null);
  const googleMapRef  = useRef(null);
  const markersRef    = useRef([]);
  const [location,    setLocation]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [locError,    setLocError]    = useState(null);
  const [activeType,  setActiveType]  = useState('hospital');
  const [places,      setPlaces]      = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [mapsLoaded,  setMapsLoaded]  = useState(false);

  // ── Load Google Maps ───────────────────────
  useEffect(() => {
    if (!MAPS_API_KEY || MAPS_API_KEY === 'your_google_maps_key') {
      setLoading(false);
      setLocError('Google Maps API key not configured. Add REACT_APP_GOOGLE_MAPS_API_KEY to .env');
      return;
    }

    const loader = new Loader({
      apiKey:    MAPS_API_KEY,
      version:   'weekly',
      libraries: ['places', 'marker'],
    });

    loader.load().then(() => {
      setMapsLoaded(true);
    }).catch((err) => {
      console.error('[Maps] Load error:', err);
      setLocError('Failed to load Google Maps.');
      setLoading(false);
    });
  }, []);

  // ── Get user location ──────────────────────
  useEffect(() => {
    if (!mapsLoaded) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        console.warn('[Geo] Error:', err);
        // Default to a fallback location
        setLocation({ lat: 13.0827, lng: 80.2707 }); // Chennai
        setLoading(false);
        showToast('Using default location (GPS unavailable)', 'warning');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [mapsLoaded]);

  // ── Init map ───────────────────────────────
  useEffect(() => {
    if (!location || !mapsLoaded || !mapRef.current || googleMapRef.current) return;

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center:    location,
      zoom:      14,
      styles:    DARK_MAP_STYLES,
      disableDefaultUI: true,
      zoomControl: true,
    });

    // User location marker
    new window.google.maps.Marker({
      position: location,
      map:      googleMapRef.current,
      icon: {
        path:          window.google.maps.SymbolPath.CIRCLE,
        scale:         10,
        fillColor:     '#00c2ff',
        fillOpacity:   1,
        strokeColor:   '#fff',
        strokeWeight:  2,
      },
      title: 'Your Location',
      zIndex: 999,
    });
  }, [location, mapsLoaded]);

  // ── Search nearby places (Places API New) ──
  const searchNearby = useCallback(async (type) => {
    if (!googleMapRef.current || !location) return;

    const typeConfig = SERVICE_TYPES.find((t) => t.id === type);
    if (!typeConfig) return;

    setSearching(true);
    setPlaces([]);

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    try {
      const { Place, SearchNearbyRankPreference } = await window.google.maps.importLibrary('places');

      const request = {
        fields:          ['displayName', 'location', 'formattedAddress', 'rating', 'regularOpeningHours', 'id'],
        locationRestriction: {
          center: new window.google.maps.LatLng(location.lat, location.lng),
          radius: 5000,
        },
        includedPrimaryTypes: [typeConfig.primaryType],
        maxResultCount:       8,
        rankPreference:       SearchNearbyRankPreference.DISTANCE,
        language:             'en-US',
      };

      const { places: results } = await Place.searchNearby(request);
      setSearching(false);

      if (!results || results.length === 0) {
        showToast('No results found nearby', 'warning');
        return;
      }

      // Normalize results to a consistent shape
      const normalized = results.map((p) => ({
        place_id:  p.id,
        name:      p.displayName,
        vicinity:  p.formattedAddress,
        rating:    p.rating,
        isOpen:    p.regularOpeningHours?.isOpen?.() ?? null,
        latLng:    p.location,
      }));

      setPlaces(normalized);

      // Add markers + info windows
      normalized.forEach((place) => {
        const marker = new window.google.maps.Marker({
          position: place.latLng,
          map:      googleMapRef.current,
          title:    place.name,
          icon: {
            path:        window.google.maps.SymbolPath.CIRCLE,
            scale:       16,
            fillColor:   typeConfig.color,
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight:2,
          },
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="background:#12121a;color:#f0f0ff;padding:10px;border-radius:8px;font-family:sans-serif;min-width:160px;">
              <strong style="font-size:14px;">${place.name}</strong>
              <p style="font-size:12px;color:#8888aa;margin:4px 0 0;">${place.vicinity || ''}</p>
              ${place.rating ? `<p style="font-size:12px;color:#ffc300;margin:4px 0 0;">⭐ ${place.rating}</p>` : ''}
              ${place.isOpen !== null ? `<p style="font-size:12px;margin:4px 0 0;color:${place.isOpen ? '#00ff88' : '#ff4500'}">${place.isOpen ? '🟢 Open' : '🔴 Closed'}</p>` : ''}
            </div>
          `,
        });
        marker.addListener('click', () => infoWindow.open(googleMapRef.current, marker));
        markersRef.current.push(marker);
      });

      // Fit bounds
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(location);
      normalized.forEach((p) => bounds.extend(p.latLng));
      googleMapRef.current.fitBounds(bounds);

    } catch (err) {
      setSearching(false);
      console.error('[Places] searchNearby error:', err);
      showToast('Places search failed — check API key & billing', 'error');
    }
  }, [location, showToast]);

  // Initial search when map ready
  useEffect(() => {
    if (location && mapsLoaded && googleMapRef.current) {
      searchNearby(activeType);
    }
  }, [location, mapsLoaded]);

  const handleTypeChange = (typeId) => {
    setActiveType(typeId);
    searchNearby(typeId);
  };

  const openDirections = (place) => {
    const dest = encodeURIComponent(place.name + ' ' + (place.vicinity || ''));
    window.open(`https://maps.google.com/maps?daddr=${dest}`, '_blank');
  };

  const activeConfig = SERVICE_TYPES.find((t) => t.id === activeType);

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      height:        '100dvh',
      animation:     'fade-in 0.4s ease',
    }}>
      {/* Header */}
      <div style={{ padding:'20px 20px 0', flexShrink:0 }}>
        <h1 style={{ fontSize:'24px', letterSpacing:'-0.02em', marginBottom:'4px' }}>
          Nearby Services
        </h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'13px', marginBottom:'16px' }}>
          Emergency services within 5km
        </p>

        {/* Type selector */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'16px' }}>
          {SERVICE_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeChange(type.id)}
              style={{
                background:   activeType === type.id ? `${type.color}22` : 'var(--bg-surface)',
                border:       `1px solid ${activeType === type.id ? type.color : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                padding:      '10px 4px',
                display:      'flex',
                flexDirection:'column',
                alignItems:   'center',
                gap:          '4px',
                transition:   'all 0.2s ease',
                boxShadow:    activeType === type.id ? `0 0 12px ${type.color}33` : 'none',
              }}
            >
              <span style={{ fontSize:'20px' }}>{type.emoji}</span>
              <span style={{
                fontSize:'10px',
                fontWeight:700,
                color: activeType === type.id ? type.color : 'var(--text-muted)',
                letterSpacing:'0.04em',
              }}>
                {type.label.toUpperCase().split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={{ position:'relative', flexShrink:0, height:'240px', margin:'0 20px', borderRadius:'var(--radius-lg)', overflow:'hidden', border:'1px solid var(--border)' }}>
        <div ref={mapRef} style={{ width:'100%', height:'100%' }} />
        {(loading || searching) && (
          <div style={{
            position:'absolute', inset:0, background:'rgba(10,10,15,0.7)',
            display:'flex', alignItems:'center', justifyContent:'center',
            backdropFilter:'blur(4px)',
          }}>
            <div style={{ textAlign:'center' }}>
              <span style={{ fontSize:'32px', animation:'spin 1s linear infinite', display:'block' }}>⟳</span>
              <p style={{ color:'var(--text-secondary)', fontSize:'13px', marginTop:'8px', fontFamily:'var(--font-mono)' }}>
                {loading ? 'Getting location...' : 'Searching nearby...'}
              </p>
            </div>
          </div>
        )}
        {locError && (
          <div style={{
            position:'absolute', inset:0, background:'var(--bg-surface)',
            display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
          }}>
            <div style={{ textAlign:'center' }}>
              <span style={{ fontSize:'40px', display:'block', marginBottom:'12px' }}>🗺️</span>
              <p style={{ color:'var(--text-secondary)', fontSize:'13px', lineHeight:1.5 }}>{locError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Results list */}
      <div style={{
        flex:       1,
        overflowY:  'auto',
        padding:    '16px 20px',
        paddingBottom: 'calc(var(--nav-height) + 16px)',
      }}>
        {searching ? (
          <p style={{ textAlign:'center', color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'13px', paddingTop:'20px' }}>
            Searching {activeConfig?.label}...
          </p>
        ) : places.length === 0 ? (
          <p style={{ textAlign:'center', color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'13px', paddingTop:'20px' }}>
            No results found
          </p>
        ) : (
          <>
            <p style={{ fontSize:'11px', fontFamily:'var(--font-mono)', color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:'12px' }}>
              {places.length} {activeConfig?.label.toUpperCase()} NEARBY
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {places.map((place, i) => (
                <div key={place.place_id || i} style={{
                  background:   'var(--bg-surface)',
                  border:       '1px solid var(--border)',
                  borderLeft:   `3px solid ${activeConfig?.color || '#888'}`,
                  borderRadius: 'var(--radius-md)',
                  padding:      '14px',
                  display:      'flex',
                  justifyContent:'space-between',
                  alignItems:   'center',
                  gap:          '12px',
                  animation:    `slide-up 0.3s ${i * 50}ms ease both`,
                }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:700, fontSize:'14px', marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {activeConfig?.emoji} {place.name}
                    </p>
                    <p style={{ fontSize:'12px', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {place.vicinity}
                    </p>
                    {place.rating && (
                      <p style={{ fontSize:'11px', color:'#ffc300', marginTop:'3px', fontFamily:'var(--font-mono)' }}>
                        ⭐ {place.rating}
                        {place.isOpen !== null && (
                          <span style={{ color: place.isOpen ? '#00ff88' : '#ff4500' }}>
                            {' · '}{place.isOpen ? '🟢 Open' : '🔴 Closed'}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openDirections(place)}
                    style={{
                      background:   `${activeConfig?.color}22`,
                      border:       `1px solid ${activeConfig?.color}44`,
                      borderRadius: 'var(--radius-sm)',
                      padding:      '8px 12px',
                      color:        activeConfig?.color,
                      fontSize:     '12px',
                      fontWeight:   700,
                      flexShrink:   0,
                      letterSpacing:'0.04em',
                    }}
                  >
                    GO →
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Dark map styles ────────────────────────────
const DARK_MAP_STYLES = [
  { elementType:'geometry',       stylers:[{ color:'#0a0a0f' }] },
  { elementType:'labels.text.stroke', stylers:[{ color:'#0a0a0f' }] },
  { elementType:'labels.text.fill',   stylers:[{ color:'#444466' }] },
  { featureType:'road', elementType:'geometry', stylers:[{ color:'#1a1a28' }] },
  { featureType:'road', elementType:'geometry.stroke', stylers:[{ color:'#12121a' }] },
  { featureType:'road', elementType:'labels.text.fill', stylers:[{ color:'#8888aa' }] },
  { featureType:'water', elementType:'geometry', stylers:[{ color:'#050510' }] },
  { featureType:'water', elementType:'labels.text.fill', stylers:[{ color:'#2a2a44' }] },
  { featureType:'poi', elementType:'geometry', stylers:[{ color:'#12121a' }] },
  { featureType:'poi.park', elementType:'geometry', stylers:[{ color:'#0d1a10' }] },
  { featureType:'transit', elementType:'geometry', stylers:[{ color:'#12121a' }] },
];
