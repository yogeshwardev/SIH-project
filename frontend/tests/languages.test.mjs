import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { STUDIO_LANGUAGES, localeForLanguage, speechCodeForLanguage } from '../src/i18n/studioCopy.js';
import bn from '../src/i18n/locales/bn.js';
import gu from '../src/i18n/locales/gu.js';
import hi from '../src/i18n/locales/hi.js';
import kn from '../src/i18n/locales/kn.js';
import ml from '../src/i18n/locales/ml.js';
import mr from '../src/i18n/locales/mr.js';
import ta from '../src/i18n/locales/ta.js';
import te from '../src/i18n/locales/te.js';

const dictionaries = { hi, te, ta, bn, mr, kn, gu, ml };
const expectedLocales = ['en', 'hi', 'te', 'ta', 'bn', 'mr', 'kn', 'gu', 'ml'];
const sourceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const dynamicUiKeys = [
  'Under ₹1,000', '₹1,000 – ₹3,000', '₹3,000 – ₹10,000', 'Over ₹10,000', 'Newest', 'Name: A–Z',
  'Handloom weaving', 'Pottery on the wheel', 'Hand block printing', 'Wood carving',
  'Made by hand', 'Direct from artisan studios', 'Checked before listing', 'Every piece is reviewed',
  'Pay when it reaches you', 'Free delivery', 'On every order in India',
  'Find something you love', 'Browse by craft, state or maker. Every listing shows who made it and where.',
  'Order with cash on delivery', 'Stock is confirmed when you order. No online payment needed.',
  'Track it to your door', 'Use your order number to follow it from Placed to Delivered.',
  'Add', 'Added', 'GI-tagged craft', 'Colour', 'Size', 'Weight', 'Reviewed listing', 'Shopper', 'Sell on CraftLink',
];

const sourceFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);
  if (entry.isDirectory()) return path.endsWith(join('i18n', 'locales')) ? [] : sourceFiles(path);
  return /\.(?:js|jsx)$/.test(entry.name) && statSync(path).isFile() ? [path] : [];
});

const literalTranslationKeys = () => {
  const keys = new Set();
  const patterns = [/\bt\(\s*'((?:\\'|[^'])*)'\s*\)/g, /\bt\(\s*"((?:\\"|[^"])*)"\s*\)/g];
  sourceFiles(sourceRoot).forEach((file) => {
    const source = readFileSync(file, 'utf8');
    patterns.forEach((pattern) => {
      for (const match of source.matchAll(pattern)) keys.add(match[1].replaceAll("\\'", "'").replaceAll('\\"', '"'));
    });
  });
  return [...keys];
};

test('the product exposes exactly nine Indian language choices with speech locales', () => {
  assert.deepEqual(STUDIO_LANGUAGES.map(({ locale }) => locale).sort(), [...expectedLocales].sort());
  assert.equal(new Set(STUDIO_LANGUAGES.map(({ locale }) => locale)).size, 9);
  STUDIO_LANGUAGES.forEach(({ locale, code, label }) => {
    assert.ok(label, `${locale} needs a native label`);
    assert.equal(localeForLanguage(code), locale);
    assert.equal(speechCodeForLanguage(locale), code);
  });
});

test('every non-English interface has the complete shared translation catalog', () => {
  const baseline = Object.keys(bn);
  assert.ok(baseline.length >= 600, 'translation catalog unexpectedly shrank');
  Object.entries(dictionaries).forEach(([locale, dictionary]) => {
    assert.deepEqual(Object.keys(dictionary).sort(), [...baseline].sort(), `${locale} translation keys differ from the shared catalog`);
    assert.equal(Object.entries(dictionary).filter(([key, value]) => !value || (key === value && /\p{L}/u.test(key))).length, 0, `${locale} contains empty or untranslated values`);
  });
});

test('literal interface copy used by components exists in every translation catalog', () => {
  const usedKeys = literalTranslationKeys();
  assert.ok(usedKeys.length > 150, 'translation key scan did not inspect the interface');
  Object.entries(dictionaries).forEach(([locale, dictionary]) => {
    const missing = usedKeys.filter((key) => !(key in dictionary));
    assert.deepEqual(missing, [], `${locale} is missing interface translations`);
  });
});

test('copy rendered from dynamic UI arrays is translated in every language', () => {
  Object.entries(dictionaries).forEach(([locale, dictionary]) => {
    const missing = dynamicUiKeys.filter((key) => !(key in dictionary));
    assert.deepEqual(missing, [], `${locale} is missing dynamic interface translations`);
  });
});
