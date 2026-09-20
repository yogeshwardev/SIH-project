import { useEffect, useRef } from 'react';

// Keep keyboard navigation inside an open dialog and return it to its trigger.
export default function useDialogFocus(isOpen, onClose) {
  const dialogRef = useRef(null);
  const closeHandler = useRef(onClose);
  closeHandler.current = onClose;
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...(dialogRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') || [])].filter(element => element.getClientRects().length);
    (focusable()[0] || dialogRef.current)?.focus();
    const handleKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeHandler.current?.(); }
      if (event.key !== 'Tab') return;
      const controls = focusable();
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); dialogRef.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    dialogRef.current?.addEventListener('keydown', handleKey);
    const dialog = dialogRef.current;
    return () => { document.body.style.overflow = overflow; dialog?.removeEventListener('keydown', handleKey); if (previous?.isConnected) previous.focus?.(); };
  }, [isOpen]);
  return dialogRef;
}
