/**
 * Voice input/output with live browser dictation, neural server voiceover,
 * and a browser text-to-speech fallback.
 */
class VoiceAssistant {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.recognition = null;
    this.audio = null;
    this.audioUrl = null;
    this.isListening = false;
    this.shouldListen = false;
    this.finalTranscript = '';
    this.onTranscriptCallback = null;
    this.onStatusCallback = null;
    this._initSpeechRecognition();
  }

  _initSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const value = event.results[i][0]?.transcript?.trim();
        if (!value) continue;
        if (event.results[i].isFinal) this.finalTranscript = `${this.finalTranscript} ${value}`.trim();
        else interim = `${interim} ${value}`.trim();
      }
      this.onTranscriptCallback?.({
        final: this.finalTranscript,
        interim,
        combined: `${this.finalTranscript} ${interim}`.trim(),
      });
    };
    this.recognition.onerror = (event) => {
      const fatal = ['not-allowed', 'service-not-allowed', 'audio-capture'].includes(event.error);
      if (fatal) this.shouldListen = false;
      this.onStatusCallback?.({ status: 'error', error: event.error, fatal });
    };
    this.recognition.onend = () => {
      this.isListening = false;
      if (this.shouldListen) {
        try {
          this.recognition.start();
          this.isListening = true;
          return;
        } catch (_) {
          this.shouldListen = false;
        }
      }
      this.onStatusCallback?.({ status: 'idle' });
    };
  }

  startListening(langCode = 'hi-IN', onTranscript, onStatus) {
    this.onTranscriptCallback = onTranscript;
    this.onStatusCallback = onStatus;
    this.finalTranscript = '';
    if (!this.recognition) {
      onStatus?.({ status: 'unsupported' });
      return false;
    }
    try {
      this.recognition.lang = langCode;
      this.shouldListen = true;
      this.recognition.start();
      this.isListening = true;
      onStatus?.({ status: 'listening' });
      return true;
    } catch (error) {
      this.shouldListen = false;
      onStatus?.({ status: 'error', error: error.message, fatal: true });
      return false;
    }
  }

  stopListening() {
    this.shouldListen = false;
    if (this.recognition && this.isListening) {
      try { this.recognition.stop(); } catch (_) { /* already stopped */ }
    }
    this.isListening = false;
  }

  async speak(text, lang = 'hi-IN', onEnd = null) {
    const cleanText = String(text || '').replace(/[*_#•]/g, ' ').trim().slice(0, 4096);
    if (!cleanText) {
      onEnd?.();
      return false;
    }
    this.stopSpeaking();
    try {
      const response = await fetch('/api/speech/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, language: lang }),
      });
      if (response.ok) {
        const blob = await response.blob();
        this.audioUrl = URL.createObjectURL(blob);
        this.audio = new Audio(this.audioUrl);
        this.audio.onended = () => this._finishSpeech(onEnd);
        this.audio.onerror = () => this._finishSpeech(onEnd);
        await this.audio.play();
        return true;
      }
    } catch (_) {
      // Browser speech keeps voiceover available offline.
    }
    return this._speakInBrowser(cleanText, lang, onEnd);
  }

  _speakInBrowser(text, lang, onEnd) {
    if (!this.synth || typeof SpeechSynthesisUtterance === 'undefined') {
      onEnd?.();
      return false;
    }
    const locale = String(lang).toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = 0.92;
    utterance.pitch = 1;
    const voices = this.synth.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase())
      || voices.find((voice) => voice.lang.toLowerCase().startsWith(locale.slice(0, 2).toLowerCase()))
      || null;
    utterance.onend = () => this._finishSpeech(onEnd);
    utterance.onerror = () => this._finishSpeech(onEnd);
    this.synth.resume();
    this.synth.speak(utterance);
    return true;
  }

  _finishSpeech(onEnd) {
    if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
    this.audioUrl = null;
    this.audio = null;
    onEnd?.();
  }

  stopSpeaking() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
    this.audio = null;
    this.audioUrl = null;
    this.synth?.cancel();
  }
}

export const voiceAssistant = new VoiceAssistant();
