import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Check, RefreshCw, SwitchCamera, X } from 'lucide-react';
import { cameraCopyFor } from '../i18n/studioCopy';

// In-app camera. Most artisans photograph the piece where they make it, on a
// phone, so the studio does not depend on a file already existing in a gallery.
export default function CameraCapture({ language, onCapture, onClose }) {
  const copy = cameraCopyFor(language);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facing, setFacing] = useState('environment');
  const [status, setStatus] = useState('starting');   // starting | live | denied | shot
  const [shot, setShot] = useState(null);             // { url, file }

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (shot) return undefined;
    let cancelled = false;
    setStatus('starting');
    navigator.mediaDevices?.getUserMedia({
      video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1920 } },
      audio: false,
    }).then((stream) => {
      if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
      stopStream();
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play?.().catch(() => { /* autoplay is best-effort */ });
      }
      setStatus('live');
    }).catch(() => { if (!cancelled) setStatus('denied'); });
    return () => { cancelled = true; };
  }, [facing, shot, stopStream]);

  useEffect(() => () => { stopStream(); }, [stopStream]);

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    // Square crop from the centre: it matches the frame the artisan aimed with
    // and the square cards the catalogue uses.
    const side = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement('canvas');
    canvas.width = side; canvas.height = side;
    canvas.getContext('2d').drawImage(
      video,
      (video.videoWidth - side) / 2, (video.videoHeight - side) / 2, side, side,
      0, 0, side, side,
    );
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `craftlink-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopStream();
      setShot({ url: URL.createObjectURL(file), file });
      setStatus('shot');
    }, 'image/jpeg', 0.92);
  };

  const retake = () => {
    if (shot?.url) URL.revokeObjectURL(shot.url);
    setShot(null);
  };

  const usePhoto = () => {
    if (!shot) return;
    onCapture(shot.file);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-950/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={copy.title}>
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="text-base font-semibold">{copy.title}</p>
        <button type="button" onClick={() => { stopStream(); onClose(); }} className="rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label={copy.close}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {shot ? (
          <img src={shot.url} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <>
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            {/* Guide frame: the artisan only has to fill the square. */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="aspect-square w-[78%] max-w-[26rem] rounded-3xl border-4 border-white/85 shadow-[0_0_0_100vmax_rgba(0,0,0,0.35)]" />
            </div>
            <p className="pointer-events-none absolute bottom-4 left-0 right-0 px-6 text-center text-[15px] font-medium text-white drop-shadow">
              {status === 'starting' ? copy.starting : copy.guide}
            </p>
          </>
        )}

        {status === 'denied' && (
          <div className="absolute inset-x-6 top-1/3 rounded-2xl bg-white p-5 text-center">
            <p className="text-[15px] font-medium text-ink-900">{copy.denied}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-5 px-6 pb-8 pt-5">
        {shot ? (
          <>
            <button type="button" onClick={retake} className="btn btn-secondary btn-lg rounded-full">
              <RefreshCw className="h-5 w-5" />{copy.retake}
            </button>
            <button type="button" onClick={usePhoto} className="btn btn-primary btn-lg rounded-full">
              <Check className="h-5 w-5" />{copy.use}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setFacing((current) => (current === 'environment' ? 'user' : 'environment'))}
              className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label={copy.switch}
            >
              <SwitchCamera className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={takePhoto}
              disabled={status !== 'live'}
              aria-label={copy.shutter}
              className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20 text-white transition active:scale-95 disabled:opacity-40"
            >
              <Camera className="h-8 w-8" />
            </button>
            <span className="w-12" aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  );
}
