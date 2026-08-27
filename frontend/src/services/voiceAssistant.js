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
    this.speechToken = 0;
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

  prepareSpeech() {
    // Resume while the user gesture is still active. This avoids browsers
    // blocking a prompt that is spoken only after an API request finishes.
    try { this.synth?.resume(); } catch (_) { /* unsupported browser */ }
  }

  async speak(text, lang = 'hi-IN', onEnd = null, options = {}) {
    const cleanText = String(text || '').replace(/[*_#•]/g, ' ').trim().slice(0, 4096);
    if (!cleanText) {
      onEnd?.();
      return false;
    }
    this.stopSpeaking();
    const speechToken = this.speechToken;
    this.prepareSpeech();

    // Questions should begin immediately and work offline. Neural server voice
    // remains available when a caller explicitly asks for it.
    if (!options.preferNeural && this._speakInBrowser(cleanText, lang, onEnd, speechToken)) {
      return true;
    }

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
        this.audio.onended = () => this._finishSpeech(onEnd, speechToken);
        this.audio.onerror = () => this._finishSpeech(onEnd, speechToken);
        await this.audio.play();
        return true;
      }
    } catch (_) {
      // Browser speech keeps voiceover available offline.
    }
    if (options.preferNeural) {
      const browserStarted = this._speakInBrowser(cleanText, lang, onEnd, speechToken);
      if (!browserStarted && speechToken === this.speechToken) onEnd?.();
      return browserStarted;
    }
    if (speechToken === this.speechToken) onEnd?.();
    return false;
  }

  _speakInBrowser(text, lang, onEnd, speechToken = this.speechToken) {
    if (!this.synth || typeof SpeechSynthesisUtterance === 'undefined') {
      return false;
    }
    const requested = String(lang || 'en-IN').toLowerCase();
    const locale = requested.startsWith('te') || requested.includes('telugu') || requested.includes('తెలుగు')
      ? 'te-IN'
      : requested.startsWith('hi') || requested.includes('hindi') || requested.includes('हिन्द')
        ? 'hi-IN'
        : requested.startsWith('ta') || requested.includes('tamil')
          ? 'ta-IN'
          : requested.startsWith('bn') || requested.includes('bengali')
            ? 'bn-IN'
            : requested.startsWith('mr') || requested.includes('marathi')
              ? 'mr-IN'
              : 'en-IN';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = 0.88;
    utterance.pitch = 1;
    const voices = this.synth.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase())
      || voices.find((voice) => voice.lang.toLowerCase().startsWith(locale.slice(0, 2).toLowerCase()))
      || null;
    utterance.onend = () => this._finishSpeech(onEnd, speechToken);
    utterance.onerror = () => this._finishSpeech(onEnd, speechToken);
    this.synth.resume();
    this.synth.speak(utterance);
    return true;
  }

  _finishSpeech(onEnd, speechToken = this.speechToken) {
    if (speechToken !== this.speechToken) return;
    if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
    this.audioUrl = null;
    this.audio = null;
    onEnd?.();
  }

  stopSpeaking() {
    this.speechToken += 1;
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
