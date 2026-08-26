/**
 * CraftLink AI Voice Assistant & Voiceover Engine
 * High-performance Web Speech API (Live Dictation) + Text-to-Speech (Multilingual Voiceover)
 */

class VoiceAssistant {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.recognition = null;
    this.isListening = false;
    this.onTranscriptCallback = null;
    this.onStatusCallback = null;
    this._initSpeechRecognition();
  }

  _initSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'hi-IN'; // Default to Hindi (India)

      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (this.onTranscriptCallback) {
          this.onTranscriptCallback({
            final: finalTranscript,
            interim: interimTranscript,
            combined: (finalTranscript + ' ' + interimTranscript).trim()
          });
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition event:', event.error);
        if (this.onStatusCallback) {
          this.onStatusCallback({ status: 'error', error: event.error });
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onStatusCallback) {
          this.onStatusCallback({ status: 'idle' });
        }
      };
    }
  }

  startListening(langCode = 'hi-IN', onTranscript, onStatus) {
    this.onTranscriptCallback = onTranscript;
    this.onStatusCallback = onStatus;

    if (!this.recognition) {
      console.warn('Web Speech Recognition not supported in this browser environment, using audio fallback.');
      if (onStatus) onStatus({ status: 'unsupported' });
      return false;
    }

    try {
      this.recognition.lang = langCode;
      this.recognition.start();
      this.isListening = true;
      if (onStatus) onStatus({ status: 'listening' });
      return true;
    } catch (err) {
      console.warn('Recognition start error:', err);
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
  }

  /**
   * AI Voiceover (Text-to-Speech)
   * Speaks aloud text in Hindi, English, or Indian accents.
   */
  speak(text, lang = 'hi-IN', onEnd = null) {
    if (!this.synth) return;
    this.synth.cancel(); // Stop any ongoing speech

    const cleanText = text.replace(/[*_#•]/g, ' ').slice(0, 300);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'hi' || lang === 'Hindi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Find best matching voice if available
    const voices = this.synth.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang.slice(0, 2)));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const voiceAssistant = new VoiceAssistant();
