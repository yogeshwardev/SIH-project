import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Volume2, 
  Sparkles, 
  Globe, 
  VolumeX
} from 'lucide-react';
import { voiceAssistant } from '../services/voiceAssistant';
import { STUDIO_LANGUAGES, recorderCopyFor } from '../i18n/studioCopy';

export default function VoiceRecorder({
  onAudioRecorded,
  isProcessing,
  samplePresets = [],
  initialLanguage = 'hi-IN',
  onLanguageChange,
  onRecordingStart,
  languageOptionsOverride,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState(initialLanguage);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingVoiceover, setIsPlayingVoiceover] = useState(false);
  const [recorderError, setRecorderError] = useState('');
  
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const transcriptRef = useRef('');
  const streamRef = useRef(null);

  const languageOptions = languageOptionsOverride
    || STUDIO_LANGUAGES.map(({ code, name, full }) => ({ code, name, label: full }));

  // The recorder speaks the artisan's language, not the portal's.
  const copy = recorderCopyFor(selectedLang);

  useEffect(() => {
    if (!isRecording && initialLanguage && initialLanguage !== selectedLang) {
      setSelectedLang(initialLanguage);
    }
  }, [initialLanguage, isRecording, selectedLang]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      voiceAssistant.stopListening();
      voiceAssistant.stopSpeaking();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Start Voice Dictation & Audio Capture
  const handleStartRecording = async () => {
    voiceAssistant.stopSpeaking();
    setIsPlayingVoiceover(false);
    onRecordingStart?.();
    setLiveTranscript('');
    transcriptRef.current = '';
    setRecorderError('');
    setRecordingTime(0);

    // 1. Start live Web Speech API stream
    voiceAssistant.startListening(
      selectedLang,
      ({ combined }) => {
        if (combined) {
          transcriptRef.current = combined;
          setLiveTranscript(combined);
        }
      },
      ({ status, error, fatal }) => {
        if (status === 'unsupported') {
          setRecorderError(copy.captionsUnavailable);
        } else if (status === 'error' && fatal) {
          setRecorderError(`${copy.captionsStopped} (${error})`);
        }
      }
    );

    // 2. Start hardware MediaRecorder for raw audio payload
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      const preferredType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find((type) => MediaRecorder.isTypeSupported?.(type));
      const mediaRecorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || preferredType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const langName = languageOptions.find((item) => item.code === selectedLang)?.name || 'Hindi';
        const extension = mimeType.includes('mp4') ? 'm4a' : 'webm';
        window.setTimeout(() => {
          const finalSpokenText = transcriptRef.current.trim();
          onAudioRecorded(blob, `artisan_speech.${extension}`, finalSpokenText || null, langName);
        }, 250);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      voiceAssistant.stopListening();
      setIsRecording(false);
      setRecorderError(copy.micFailed);
      return;
    }

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    voiceAssistant.stopListening();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      const finalText = transcriptRef.current.trim();
      if (finalText) {
        const finalLangName = languageOptions.find((item) => item.code === selectedLang)?.name || 'Hindi';
        onAudioRecorded(new Blob(), 'voice.txt', finalText, finalLangName);
      } else {
        setRecorderError(copy.noRecording);
      }
    }
  };

  const handlePlayVoiceover = (textToRead) => {
    if (isPlayingVoiceover) {
      voiceAssistant.stopSpeaking();
      setIsPlayingVoiceover(false);
    } else {
      setIsPlayingVoiceover(true);
      voiceAssistant.speak(textToRead || liveTranscript, selectedLang, () => {
        setIsPlayingVoiceover(false);
      });
    }
  };

  const handleSelectSample = (sample) => {
    setLiveTranscript(sample.text);
    transcriptRef.current = sample.text;
    const sampleMarker = new Blob([sample.text], { type: 'text/plain' });
    onAudioRecorded(sampleMarker, `${sample.id}.txt`, sample.text, sample.language);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section className="card card-pad">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950"><Mic className="h-4 w-4 text-clay-500" />{copy.title}</h3>
          <p className="mt-0.5 text-sm text-ink-500">{copy.instruction}</p>
        </div>
        <label className="relative inline-flex h-10 items-center gap-1.5 self-start rounded-lg border border-line-strong bg-white pl-2.5 pr-3 text-sm font-medium text-ink-800 focus-within:ring-4 focus-within:ring-brand-600/10 sm:self-auto">
          <Globe className="h-4 w-4 text-ink-500" />
          <span className="sr-only">{copy.language}</span>
          <select
            aria-label={copy.language}
            value={selectedLang}
            onChange={(e) => {
              const code = e.target.value;
              setSelectedLang(code);
              onLanguageChange?.(languageOptions.find((item) => item.code === code)?.name || 'Hindi', code);
            }}
            disabled={isRecording}
            className="cursor-pointer bg-transparent outline-none"
          >
            {languageOptions.map((opt) => <option key={opt.code} value={opt.code}>{opt.label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-col items-center rounded-2xl bg-paper-100 px-4 py-8">
        {!isRecording ? (
          <button
            type="button"
            aria-label={copy.startRecording}
            onClick={handleStartRecording}
            disabled={isProcessing}
            className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-white shadow-lift transition hover:scale-105 hover:bg-brand-700 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:opacity-50 sm:h-24 sm:w-24"
          >
            <span className="absolute inset-0 rounded-full bg-brand-600 opacity-20 group-hover:animate-ping" />
            <Mic className="h-9 w-9" />
          </button>
        ) : (
          <button
            type="button"
            aria-label={copy.stopRecording}
            onClick={handleStopRecording}
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-white shadow-lift transition hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300 sm:h-24 sm:w-24"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-40" />
            <Square className="h-8 w-8 fill-current" />
          </button>
        )}

        <p className="mt-4 text-center text-sm font-semibold text-ink-900">{isProcessing ? copy.processing : isRecording ? copy.listening : copy.tapMic}</p>
        {isRecording ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-red-700"><span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />{copy.recording} {formatTime(recordingTime)} — {copy.finish}</p>
        ) : (
          <p className="mt-1 text-xs text-ink-500">{copy.answerOnly}</p>
        )}

        {(liveTranscript || isRecording) && (
          <div className="mt-5 w-full max-w-lg rounded-xl border border-line bg-white p-4 text-left animate-fade-up">
            <div className="flex items-center justify-between gap-2 border-b border-line pb-2 text-xs font-semibold text-ink-500">
              <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-clay-500" />{copy.yourWords} ({selectedLang.split('-')[0].toUpperCase()})</span>
              {liveTranscript && (
                <button type="button" aria-pressed={isPlayingVoiceover} onClick={() => handlePlayVoiceover(liveTranscript)} className="btn btn-ghost btn-sm min-h-0 h-7 px-2 text-brand-700">
                  {isPlayingVoiceover ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  {isPlayingVoiceover ? copy.stopVoice : copy.listen}
                </button>
              )}
            </div>
            <p className="mt-2 min-h-[36px] text-sm italic leading-relaxed text-ink-800">“{liveTranscript || copy.listeningToYou}”</p>
          </div>
        )}
      </div>

      {recorderError && <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{recorderError}</p>}

      {samplePresets.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Or use a sample answer</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {samplePresets.map((preset) => (
              <button type="button" key={preset.id} onClick={() => handleSelectSample(preset)} className="rounded-xl border border-line p-3 text-left text-sm hover:border-brand-600 hover:bg-brand-50/40">
                <span className="flex items-center justify-between font-semibold text-ink-900"><span className="truncate">{preset.title}</span><span className="badge bg-paper-200 text-ink-600 ring-transparent">{preset.language}</span></span>
                <span className="mt-0.5 block truncate text-xs text-ink-500">{preset.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
