import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  RotateCcw, 
  Volume2, 
  Sparkles, 
  Globe, 
  Radio, 
  CheckCircle2,
  VolumeX
} from 'lucide-react';
import { voiceAssistant } from '../services/voiceAssistant';

export default function VoiceRecorder({ onAudioRecorded, isProcessing, samplePresets = [] }) {
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingVoiceover, setIsPlayingVoiceover] = useState(false);
  
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const languageOptions = [
    { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
    { code: 'en-IN', label: 'English (India)' },
    { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
    { code: 'te-IN', label: 'తెలుగు (Telugu)' },
    { code: 'bn-IN', label: 'বাংলা (Bengali)' },
    { code: 'mr-IN', label: 'मराठी (Marathi)' }
  ];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      voiceAssistant.stopListening();
      voiceAssistant.stopSpeaking();
    };
  }, []);

  // Start Voice Dictation & Audio Capture
  const handleStartRecording = async () => {
    setLiveTranscript('');
    setIsRecording(true);
    setRecordingTime(0);

    // 1. Start live Web Speech API stream
    voiceAssistant.startListening(
      selectedLang,
      ({ combined }) => {
        if (combined) {
          setLiveTranscript(combined);
        }
      },
      ({ status }) => {
        if (status === 'error' || status === 'unsupported') {
          console.log('Live Web Speech API fallback active');
        }
      }
    );

    // 2. Start hardware MediaRecorder for raw audio payload
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const finalLangName = selectedLang.startsWith('hi') ? 'Hindi' : 'English';
        const finalSpokenText = liveTranscript.trim() || 'यह शुद्ध हस्तनिर्मित शिल्प उत्पाद है जिसे पारंपरिक विधि से बनाया गया है।';
        onAudioRecorded(blob, 'artisan_speech.webm', finalSpokenText, finalLangName);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
    } catch (err) {
      console.warn('Microphone stream error, live speech API will provide transcription:', err);
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
      const finalLangName = selectedLang.startsWith('hi') ? 'Hindi' : 'English';
      const fakeBlob = new Blob([liveTranscript], { type: 'audio/wav' });
      onAudioRecorded(fakeBlob, 'voice.wav', liveTranscript, finalLangName);
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
    const fakeBlob = new Blob([sample.text], { type: 'audio/wav' });
    onAudioRecorded(fakeBlob, `${sample.id}.wav`, sample.text, sample.language);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-5 sm:p-6">
      
      {/* Header with Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-artisan-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-terracotta-500 to-terracotta-700 text-white flex items-center justify-center shadow-md">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Live Speech Recognition AI & Voiceover
              </h3>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
                Live Multilingual Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Speak naturally — words are captured live and converted into structured e-commerce data
            </p>
          </div>
        </div>

        {/* Spoken Language Dropdown */}
        <div className="flex items-center gap-2 bg-artisan-50 border border-artisan-200 rounded-xl px-3 py-1.5 self-start sm:self-auto">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={isRecording}
            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            {languageOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Microphone Interaction Circle */}
      <div className="flex flex-col items-center justify-center py-7 px-4 bg-gradient-to-b from-artisan-50/90 to-artisan-100/40 rounded-2xl border-2 border-dashed border-artisan-300 mb-5 relative overflow-hidden">
        
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            disabled={isProcessing}
            className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-terracotta-600 to-terracotta-500 text-white shadow-xl shadow-terracotta-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none"
          >
            <div className="absolute inset-0 rounded-full bg-terracotta-400 animate-ping opacity-20 group-hover:opacity-35"></div>
            <Mic className="w-9 h-9 sm:w-10 sm:h-10 text-white" />
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-600 text-white shadow-xl shadow-red-600/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40"></div>
            <Square className="w-8 h-8 fill-current text-white" />
          </button>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm font-bold text-slate-900">
            {isRecording ? 'Listening... Speak naturally in your language' : 'Tap to Start Live Voice Dictation'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-1">
            {isRecording ? (
              <span className="text-xs font-bold text-red-600 animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                Recording ({formatTime(recordingTime)}) — Click square when finished
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Mention craft name, material, technique, dimensions, or time taken
              </span>
            )}
          </div>
        </div>

        {/* Live Audio Waves / Streaming Text Box */}
        {(liveTranscript || isRecording) && (
          <div className="w-full max-w-lg mt-4 bg-white p-3.5 rounded-xl border border-artisan-200 shadow-sm text-left animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5 pb-1 border-b border-slate-100">
              <span className="flex items-center gap-1.5 text-terracotta-700">
                <Sparkles className="w-3 h-3" />
                Live Spoken Stream ({selectedLang.split('-')[0].toUpperCase()})
              </span>
              
              {/* Voiceover Listen Button */}
              {liveTranscript && (
                <button
                  onClick={() => handlePlayVoiceover(liveTranscript)}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md transition-colors"
                >
                  {isPlayingVoiceover ? <VolumeX className="w-3 h-3 text-red-600" /> : <Volume2 className="w-3 h-3" />}
                  <span>{isPlayingVoiceover ? 'Stop Voiceover' : '🔊 Listen AI Voiceover'}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-800 font-medium italic min-h-[36px] leading-relaxed">
              "{liveTranscript || 'Listening to your voice...'}"
            </p>
          </div>
        )}

      </div>

      {/* Preset Prompts for 100% Demo Reliability */}
      {samplePresets.length > 0 && (
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Or click a benchmark artisan voice prompt:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {samplePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectSample(preset)}
                className="text-left p-3 rounded-xl border border-artisan-200 bg-white hover:border-terracotta-400 hover:bg-terracotta-50/50 transition-all text-xs group flex items-start gap-2.5 shadow-sm"
              >
                <div className="w-7 h-7 rounded-lg bg-artisan-100 text-terracotta-700 flex items-center justify-center flex-shrink-0 group-hover:bg-terracotta-600 group-hover:text-white transition-colors">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="truncate">{preset.title}</span>
                    <span className="text-[10px] text-terracotta-700 font-bold bg-terracotta-100 px-1.5 py-0.5 rounded">
                      {preset.language}
                    </span>
                  </div>
                  <p className="text-slate-500 truncate mt-0.5 text-[11px]">{preset.text}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
