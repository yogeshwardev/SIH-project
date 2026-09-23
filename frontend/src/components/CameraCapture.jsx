import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Image as ImageIcon, RefreshCw, SwitchCamera, X, Zap, ZapOff } from 'lucide-react';
import { cameraCopyFor } from '../i18n/studioCopy';

// In-app camera. Most artisans photograph the piece where they make it, on a
// phone, so the studio does not depend on a file already existing in a gallery.
//
// The one rule this screen has to keep: what the guide frame shows is exactly
// what gets saved. The preview fills the screen with object-cover, which crops
// the sensor image, and the guide square then crops that again — so the saved
// photo is computed back through both, rather than taken from the middle of the
// sensor and hoped for.
export default function CameraCapture({ language, onCapture, onClose }) {
  const copy = cameraCopyFor(language);
  const videoRef = useRef(null);
  const frameRef = useRef(null);
  const streamRef = useRef(null);
  const [facing, setFacing] = useState('environment');
  const [status, setStatus] = useState('starting');   // starting | live | denied | shot
  const [shot, setShot] = useState(null);             // { url, file }
  const [torch, setTorch] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setHasTorch(false);
    setTorch(false);
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
      // A torch exists on most rear cameras and on almost no front ones.
      const capabilities = stream.getVideoTracks()[0]?.getCapabilities?.() || {};
      setHasTorch(Boolean(capabilities.torch));
      setStatus('live');
    }).catch(() => { if (!cancelled) setStatus('denied'); });
    return () => { cancelled = true; };
  }, [facing, shot, stopStream]);

  useEffect(() => () => { stopStream(); }, [stopStream]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torch;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorch(next);
    } catch {
      // Some devices advertise a torch and then refuse it. Say nothing and
      // leave the button off rather than claiming a light that is not on.
      setHasTorch(false);
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const frame = frameRef.current;
    if (!video?.videoWidth || !frame) return;

    // Map the guide square, which is in screen pixels, back to sensor pixels.
    const view = video.getBoundingClientRect();
    const box = frame.getBoundingClientRect();
    // object-cover scales by whichever axis has to fill, and centres the rest.
    const scale = Math.max(view.width / video.videoWidth, view.height / video.videoHeight);
    const shownWidth = video.videoWidth * scale;
    const shownHeight = video.videoHeight * scale;
    const offsetX = (view.width - shownWidth) / 2;
    const offsetY = (view.height - shownHeight) / 2;

    const side = Math.round(box.width / scale);
    let sourceX = Math.round((box.left - view.left - offsetX) / scale);
    const sourceY = Math.round((box.top - view.top - offsetY) / scale);
    if (facing === 'user') {
      // The front preview is flipped, so a frame on the left of the screen is
      // on the right of the sensor image. Centred frames make this a no-op,
      // but the mapping should not depend on the frame staying centred.
      sourceX = video.videoWidth - sourceX - side;
    }
    // Never read outside the sensor image, whatever the layout does.
    const clampedSide = Math.max(1, Math.min(side, video.videoWidth, video.videoHeight));
    const clampedX = Math.max(0, Math.min(sourceX, video.videoWidth - clampedSide));
    const clampedY = Math.max(0, Math.min(sourceY, video.videoHeight - clampedSide));

    const canvas = document.createElement('canvas');
    canvas.width = clampedSide;
    canvas.height = clampedSide;
    const context = canvas.getContext('2d');
    if (facing === 'user') {
      // The front preview is mirrored, so the saved photo is mirrored back.
      context.translate(clampedSide, 0);
      context.scale(-1, 1);
    }
    context.drawImage(
      video,
      clampedX, clampedY, clampedSide, clampedSide,
      0, 0, clampedSide, clampedSide,
    );
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `craftlink-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopStream();
      setShot({ url: URL.createObjectURL(file), file });
      setStatus('shot');
      navigator.vibrate?.(12);
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

  // When the camera is refused there is still a way to get a photo in, so the
  // artisan is never stuck on a dead screen.
  const pickFromGallery = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    stopStream();
    setShot({ url: URL.createObjectURL(file), file });
    setStatus('shot');
  };

  const close = () => { stopStream(); onClose(); };

  // On <body>, so no animated ancestor in the studio can turn this into a
  // 358x1453 box wedged between the header and the tab bar.
  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Top bar: close on the left, light on the right, the way every phone
          camera puts them. */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <button
          type="button"
          onClick={close}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/90 active:bg-white/10"
          aria-label={copy.close}
        >
          <X className="h-6 w-6" />
        </button>
        <p className="text-[13px] font-medium tracking-wide text-white/70">{copy.title}</p>
        {hasTorch && !shot ? (
          <button
            type="button"
            onClick={toggleTorch}
            aria-pressed={torch}
            aria-label={copy.torch || 'Flash'}
            className={`flex h-11 w-11 items-center justify-center rounded-full active:bg-white/10 ${torch ? 'text-clay-300' : 'text-white/90'}`}
          >
            {torch ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
          </button>
        ) : (
          <span className="h-11 w-11" aria-hidden="true" />
        )}
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {shot ? (
          <img src={shot.url} alt="" className="h-full w-full object-contain" />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className={`h-full w-full object-cover ${facing === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            {/* Guide frame. Corner brackets rather than a full border: they
                read as a camera, and they do not fight the product for edges.
                The dim outside is what the saved photo leaves out. */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                ref={frameRef}
                className="relative aspect-square w-[86%] max-w-[26rem] shadow-[0_0_0_100vmax_rgba(0,0,0,0.45)]"
              >
                {[
                  'left-0 top-0 border-l-[3px] border-t-[3px] rounded-tl-xl',
                  'right-0 top-0 border-r-[3px] border-t-[3px] rounded-tr-xl',
                  'left-0 bottom-0 border-b-[3px] border-l-[3px] rounded-bl-xl',
                  'right-0 bottom-0 border-b-[3px] border-r-[3px] rounded-br-xl',
                ].map((corner) => (
                  <span key={corner} className={`absolute h-8 w-8 border-white/95 ${corner}`} />
                ))}
              </div>
            </div>
            <p className="pointer-events-none absolute bottom-3 left-0 right-0 px-8 text-center text-[14px] font-medium leading-snug text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.8)]">
              {status === 'starting' ? copy.starting : copy.guide}
            </p>
          </>
        )}

        {status === 'denied' && (
          <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 text-center">
            <p className="text-[15px] font-medium text-ink-900">{copy.denied}</p>
            <label className="btn btn-primary mt-4 w-full cursor-pointer rounded-full">
              <ImageIcon className="h-5 w-5" />
              {copy.gallery || 'Choose a photo'}
              <input type="file" accept="image/*" className="sr-only" onChange={pickFromGallery} />
            </label>
          </div>
        )}
      </div>

      {/* Shutter row. Three equal columns keep the shutter on the centre line
          of the screen however wide the side controls become in a language
          with longer words. */}
      <div className="grid grid-cols-3 items-center px-6 pb-5 pt-4">
        {shot ? (
          <>
            <button
              type="button"
              onClick={retake}
              className="flex items-center gap-2 justify-self-start rounded-full px-3 py-2.5 text-[15px] font-semibold text-white active:bg-white/10"
            >
              <RefreshCw className="h-5 w-5" />{copy.retake}
            </button>
            <span aria-hidden="true" />
            <button
              type="button"
              onClick={usePhoto}
              className="flex items-center gap-2 justify-self-end rounded-full bg-clay-400 px-5 py-3 text-[15px] font-bold text-ink-950 active:scale-95"
            >
              <Check className="h-5 w-5" />{copy.use}
            </button>
          </>
        ) : (
          <>
            <label
              className="flex h-12 w-12 cursor-pointer items-center justify-center justify-self-start rounded-full bg-white/10 text-white active:bg-white/20"
              aria-label={copy.gallery || 'Choose a photo'}
            >
              <ImageIcon className="h-6 w-6" />
              <input type="file" accept="image/*" className="sr-only" onChange={pickFromGallery} />
            </label>
            <button
              type="button"
              onClick={takePhoto}
              disabled={status !== 'live'}
              aria-label={copy.shutter}
              className="h-[74px] w-[74px] justify-self-center rounded-full border-[5px] border-white/90 p-1 transition active:scale-95 disabled:opacity-40"
            >
              <span className="block h-full w-full rounded-full bg-white" />
            </button>
            <button
              type="button"
              onClick={() => setFacing((current) => (current === 'environment' ? 'user' : 'environment'))}
              className="flex h-12 w-12 items-center justify-center justify-self-end rounded-full bg-white/10 text-white active:bg-white/20"
              aria-label={copy.switch}
            >
              <SwitchCamera className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
