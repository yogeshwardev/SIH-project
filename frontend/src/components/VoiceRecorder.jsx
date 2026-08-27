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

export default function VoiceRecorder({
  onAudioRecorded,
  isProcessing,
  samplePresets = [],
  initialLanguage = 'hi-IN',
  onLanguageChange,
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

  const languageOptions = [
    { code: 'hi-IN', name: 'Hindi', label: 'हिन्दी (Hindi)' },
    { code: 'te-IN', name: 'Telugu', label: 'తెలుగు (Telugu)' },
    { code: 'en-IN', name: 'English', label: 'English (India)' },
    { code: 'ta-IN', name: 'Tamil', label: 'தமிழ் (Tamil)' },
    { code: 'bn-IN', name: 'Bengali', label: 'বাংলা (Bengali)' },
    { code: 'mr-IN', name: 'Marathi', label: 'मराठी (Marathi)' }
  ];

  const primaryLanguage = String(selectedLang || '').split('-')[0].toLowerCase();
  const copy = primaryLanguage === 'te' ? {
    title: 'వాయిస్‌తో సమాధానం చెప్పండి',
    instruction: 'మీ భాషను ఎంచుకుని మైక్ నొక్కి మాట్లాడండి. పూర్తయ్యాక ఎరుపు బటన్ నొక్కండి.',
    listening: 'వింటున్నాం… నెమ్మదిగా మీ మాటల్లో చెప్పండి',
    tapMic: 'సమాధానం చెప్పడానికి మైక్ నొక్కండి',
    recording: 'రికార్డింగ్',
    finish: 'పూర్తయ్యాక ఎరుపు బటన్ నొక్కండి',
    answerOnly: 'పైన ఉన్న సులభమైన ప్రశ్నకు సమాధానం చెప్పండి',
    yourWords: 'మీ మాటలు',
    stopVoice: 'వాయిస్ ఆపండి',
    listen: 'విని చూడండి',
    listeningToYou: 'మీ మాటలు వింటున్నాం…',
    captionsUnavailable: 'ఈ బ్రౌజర్‌లో వెంటనే మాటలు చూపడం లేదు. మీరు ఆపిన తర్వాత రికార్డింగ్‌ను చదువుతాం.',
    captionsStopped: 'వెంటనే మాటలు చూపడం ఆగింది. రికార్డ్ చేసిన వాయిస్‌ను ఇంకా చదవవచ్చు.',
    micFailed: 'మైక్ అనుమతి ఇవ్వండి, తర్వాత మళ్లీ ప్రయత్నించండి.',
    noRecording: 'వాయిస్ రికార్డ్ కాలేదు. మైక్ అనుమతి ఇచ్చి మళ్లీ ప్రయత్నించండి.',
  } : primaryLanguage === 'hi' ? {
    title: 'आवाज़ में जवाब दें',
    instruction: 'अपनी भाषा चुनें, माइक दबाकर बोलें और पूरा होने पर लाल बटन दबाएँ।',
    listening: 'सुन रहे हैं… अपने शब्दों में धीरे बोलिए',
    tapMic: 'जवाब देने के लिए माइक दबाएँ',
    recording: 'रिकॉर्डिंग',
    finish: 'पूरा होने पर लाल बटन दबाएँ',
    answerOnly: 'ऊपर दिए आसान सवाल का जवाब दें',
    yourWords: 'आपके शब्द',
    stopVoice: 'आवाज़ रोकें',
    listen: 'सुनें',
    listeningToYou: 'आपको सुन रहे हैं…',
    captionsUnavailable: 'इस ब्राउज़र में तुरंत शब्द नहीं दिखेंगे। रोकने के बाद रिकॉर्डिंग पढ़ी जाएगी।',
    captionsStopped: 'तुरंत शब्द दिखना रुक गया। रिकॉर्ड की गई आवाज़ अभी भी पढ़ी जा सकती है।',
    micFailed: 'माइक की अनुमति दें और फिर कोशिश करें।',
    noRecording: 'आवाज़ रिकॉर्ड नहीं हुई। माइक की अनुमति देकर फिर कोशिश करें।',
  } : {
    title: 'Answer by Voice',
    instruction: 'Choose your language, tap the microphone, speak, then tap the red button.',
    listening: 'Listening… speak slowly in your own words',
    tapMic: 'Tap the microphone to answer',
    recording: 'Recording',
    finish: 'tap the red button when finished',
    answerOnly: 'Answer the simple question shown above',
    yourWords: 'Your words',
    stopVoice: 'Stop voice',
    listen: 'Listen',
    listeningToYou: 'Listening to you…',
    captionsUnavailable: 'Live captions are unavailable. The recording will be transcribed after you stop.',
    captionsStopped: 'Live captions stopped. The recorded audio can still be transcribed.',
    micFailed: 'Allow microphone permission and try again.',
    noRecording: 'No voice was recorded. Allow microphone permission and try again.',
  };

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
                {copy.title}
              </h3>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
                Hindi • English • తెలుగు
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {copy.instruction}
            </p>
          </div>
        </div>

        {/* Spoken Language Dropdown */}
        <div className="flex items-center gap-2 bg-artisan-50 border border-artisan-200 rounded-xl px-3 py-1.5 self-start sm:self-auto">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedLang}
            onChange={(e) => {
              const code = e.target.value;
              setSelectedLang(code);
              onLanguageChange?.(languageOptions.find((item) => item.code === code)?.name || 'Hindi', code);
            }}
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
            {isRecording ? copy.listening : copy.tapMic}
          </p>
          <div className="flex items-center justify-center gap-2 mt-1">
            {isRecording ? (
              <span className="text-xs font-bold text-red-600 animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                {copy.recording} ({formatTime(recordingTime)}) — {copy.finish}
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                {copy.answerOnly}
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
                {copy.yourWords} ({selectedLang.split('-')[0].toUpperCase()})
              </span>
              
              {/* Voiceover Listen Button */}
              {liveTranscript && (
                <button
                  onClick={() => handlePlayVoiceover(liveTranscript)}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md transition-colors"
                >
                  {isPlayingVoiceover ? <VolumeX className="w-3 h-3 text-red-600" /> : <Volume2 className="w-3 h-3" />}
                  <span>{isPlayingVoiceover ? copy.stopVoice : `🔊 ${copy.listen}`}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-800 font-medium italic min-h-[36px] leading-relaxed">
              "{liveTranscript || copy.listeningToYou}"
            </p>
          </div>
        )}

      </div>

      {recorderError && (
        <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          {recorderError}
        </div>
      )}

      {/* Optional sample answers for guided demonstrations. */}
      {samplePresets.length > 0 && (
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Or use a sample answer:
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
