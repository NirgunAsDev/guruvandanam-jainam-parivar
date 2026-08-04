import React, { useRef, useEffect } from 'react';

export default function VideoModal({ isOpen, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div className="video-modal" onClick={e => e.stopPropagation()}>
        <div className="video-modal-header">
          <h2 className="video-modal-title">આરાધના પત્રક — Help Video</h2>
          <button className="video-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="video-modal-body">
          <video
            ref={videoRef}
            className="video-modal-player"
            src="/Aradhna-patrak-video.mp4"
            controls
            playsInline
          />
        </div>
      </div>
    </div>
  );
}
