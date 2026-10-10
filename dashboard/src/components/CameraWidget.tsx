import { useState } from 'react';

// MediaMTX serves:
//  WebRTC: http://localhost:8889/door/
//  HLS:    http://localhost:8888/door/  (more compatible fallback)
export function CameraWidget() {
  const [useHls, setUseHls] = useState(false);
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const webrtcUrl = `http://${host}:8889/door/`;
  const hlsUrl = `http://${host}:8888/door/`;

  return (
    <div className="camera-container">
      {useHls ? (
        /* HLS fallback via a simple video tag with hls.js loaded inline */
        <iframe
          src={hlsUrl}
          className="camera-feed"
          title="Door Camera (HLS)"
          allow="autoplay"
        />
      ) : (
        /* Primary: WebRTC via MediaMTX built-in player */
        <iframe
          src={webrtcUrl}
          className="camera-feed"
          title="Door Camera Live"
          allow="autoplay; camera"
          onError={() => setUseHls(true)}
        />
      )}

      <div className="camera-badge">
        <span className="camera-dot" />
        LIVE
      </div>

      {/* Toggle button for debugging */}
      <button
        onClick={() => setUseHls(v => !v)}
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white',
          padding: '4px 10px',
          borderRadius: 8,
          fontSize: '0.75rem',
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
        }}
        title="Switch stream type"
      >
        {useHls ? 'Try WebRTC' : 'Try HLS'}
      </button>
    </div>
  );
}
