import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceAssistant } from '../src/services/voiceAssistant.js';

function setup(voices) {
  const spoken = [];
  globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  const synth = { getVoices: () => voices, speak: value => spoken.push(value), cancel() {}, resume() {} };
  globalThis.window = { speechSynthesis: synth, setTimeout, clearTimeout };
  return { assistant: new VoiceAssistant(), spoken };
}

test('English fallback never selects a Hindi-only default voice', () => {
  const { assistant, spoken } = setup([{ name: 'Swara', lang: 'hi-IN' }]);
  assert.equal(assistant._speakInBrowser('Hello', 'en-IN'), false);
  assert.equal(spoken.length, 0);
});

test('Telugu fallback never selects a Hindi-only default voice', () => {
  const { assistant, spoken } = setup([{ name: 'Swara', lang: 'hi-IN' }]);
  assert.equal(assistant._speakInBrowser('నమస్కారం', 'te-IN'), false);
  assert.equal(spoken.length, 0);
});

test('each language uses its matching browser voice', () => {
  const voices = ['hi-IN', 'te-IN', 'en-IN'].map(lang => ({ lang, name: lang }));
  const { assistant, spoken } = setup(voices);
  for (const lang of ['te-IN', 'en-IN', 'hi-IN']) {
    assert.equal(assistant._speakInBrowser('Question', lang), true);
    assert.equal(spoken.at(-1).voice.lang, lang);
  }
});

test('cancelled neural request cannot play an old question', async () => {
  const { assistant, spoken } = setup([{ name: 'Swara', lang: 'hi-IN' }]);
  let finish;
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  const pending = assistant.speak('Old question', 'hi-IN');
  assistant.stopSpeaking();
  finish({ ok: false });
  assert.equal(await pending, false);
  assert.equal(spoken.length, 0);
});

test('Telugu neural request stays active when no Telugu local fallback exists', async () => {
  const { assistant } = setup([{ name: 'Swara', lang: 'hi-IN' }]);
  let request;
  globalThis.fetch = async (_url, options) => { request = options; return { ok: false }; };
  assert.equal(await assistant.speak('నమస్కారం', 'te-IN'), false);
  assert.equal(request.signal, undefined);
  assert.equal(JSON.parse(request.body).language, 'te-IN');
});
