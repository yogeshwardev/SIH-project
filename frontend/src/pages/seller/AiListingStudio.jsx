import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Camera, Check, CheckCircle2, ChevronDown, Edit3, Globe, ImagePlus, MessageSquare, Mic, Palette, Plus, RefreshCw, Search, Send, ShieldCheck, Sparkles, Tag, Trash2, Upload, Volume2, VolumeX, X } from 'lucide-react';
import { api } from '../../services/api';
import { voiceAssistant } from '../../services/voiceAssistant';
import BeforeAfterSlider from '../../components/BeforeAfterSlider';
import VoiceRecorder from '../../components/VoiceRecorder';
import CameraCapture from '../../components/CameraCapture';
import PriceExplainerCard from '../../components/PriceExplainerCard';
import { Notice } from '../../components/ui';
import { useLanguage } from '../../context/LanguageContext';
import {
  STUDIO_LANGUAGES, cameraCopyFor, confirmationAnswerFor, languageNameFor,
  localeForLanguage, speechCodeForLanguage, studioCopyFor,
} from '../../i18n/studioCopy';

const SELLER_LANGUAGE_OPTIONS = STUDIO_LANGUAGES;
const questionUiCopyFor = studioCopyFor;
const confirmationAnswerForLanguage = confirmationAnswerFor;
const MAX_PRODUCT_IMAGES = 6;
const BACKGROUND_OPTIONS = [
  { id: 'warm-studio', label: 'Warm studio', description: 'Premium cream', swatch: 'bg-[#eee2cb]' },
  { id: 'pure-white', label: 'Classic white', description: 'Marketplace clean', swatch: 'bg-white' },
  { id: 'soft-gray', label: 'Soft grey', description: 'Modern neutral', swatch: 'bg-[#dfe3e7]' },
  { id: 'natural-linen', label: 'Natural linen', description: 'Craft-friendly', swatch: 'bg-[#d9c3a0]' },
  { id: 'deep-charcoal', label: 'Deep charcoal', description: 'Bold contrast', swatch: 'bg-[#262b2f]' },
  { id: 'blush', label: 'Soft blush', description: 'Warm and gentle', swatch: 'bg-[#f1d4d1]' },
  { id: 'sage', label: 'Sage green', description: 'Calm and natural', swatch: 'bg-[#c7d3bd]' },
  { id: 'sky', label: 'Sky blue', description: 'Fresh and bright', swatch: 'bg-[#c5dfea]' },
  { id: 'sand', label: 'Golden sand', description: 'Earthy warmth', swatch: 'bg-[#dec59a]' },
  { id: 'terracotta', label: 'Terracotta', description: 'Artisan character', swatch: 'bg-[#b96f53]' },
];

// Guided listing flow: photo -> one question at a time -> review -> fair price -> submit.
export default function AiListingStudio({ onProductCreated, onViewProducts, artisanId, artisanName }) {
  const { locale, t } = useLanguage();
  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [loadMsg, setLoadMsg]     = useState('');
  const [error, setError]         = useState(null);
  const [speaking, setSpeaking]   = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);

  const [images, setImages]       = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [backgroundStyle, setBackgroundStyle] = useState('warm-studio');
  const [customBackgroundFile, setCustomBackgroundFile] = useState(null);
  const [customBackgroundPreview, setCustomBackgroundPreview] = useState('');
  const [backgroundPanelOpen, setBackgroundPanelOpen] = useState(false);
  const [editingBackgroundIndex, setEditingBackgroundIndex] = useState(null);
  const [changingImageIndex, setChangingImageIndex] = useState(null);
  const imgData = images[0] || null;
  const activeImage = images[activeImageIndex] || imgData;
  const selectedBackground = BACKGROUND_OPTIONS.find(option => option.id === backgroundStyle);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [transcript, setTxt]      = useState('');
  // Nine languages can be spoken here, whatever the portal's own interface
  // language is: the artisan answers in the one they are comfortable with.
  const [answerLocale, setAnswerLocale] = useState(() => localeForLanguage(locale));
  const detLang = languageNameFor(answerLocale);
  const [interviewLocale, setInterviewLocale] = useState(() => localeForLanguage(locale));
  const [languageChanging, setLanguageChanging] = useState(false);
  const [attrs, setAttrs]         = useState(null);
  const [editMode, setEditMode]   = useState(false);
  const [listing, setListing]     = useState(null);
  const [listLang, setListLang]   = useState(locale);
  useEffect(() => { setListLang(locale); }, [locale]);
  const [pricing, setPricing]     = useState(null);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [costs, setCosts]         = useState({ material_cost: null, labor_cost: null, packaging_cost: null, production_time: '' });
  const [interview, setInterview] = useState(null);
  const [interviewTurns, setInterviewTurns] = useState([]);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [productId, setProductId] = useState(null);
  const lastAutoSpokenQuestionRef = useRef('');
  const speechRequestRef = useRef(0);
  const questionUi = questionUiCopyFor(detLang);
  const cameraCopy = cameraCopyFor(detLang);
  const isAmountQuestion = interview?.input_type === 'amount';

  const STEPS = [
    { n: 1, label: 'Your photo', sub: 'We clean up the background' },
    { n: 2, label: 'A few questions', sub: 'One easy question at a time' },
    { n: 3, label: 'Check details', sub: 'Your words, your product' },
    { n: 4, label: 'Your price', sub: 'Based on your own costs' },
    { n: 5, label: 'Send for checking', sub: 'We look before it goes live' },
  ];

  const clearQuestionFlow = () => {
    voiceAssistant.stopSpeaking();
    lastAutoSpokenQuestionRef.current = '';
    setSpeaking(false); setVoiceLoading(false);
    setTxt(''); setAttrs(null); setListing(null); setPricing(null);
    setCosts({ material_cost: null, labor_cost: null, packaging_cost: null, production_time: '' });
    setInterview(null); setInterviewTurns([]); setQuestionHistory([]); setTypedAnswer(''); setPendingAnswer(null);
  };

  const speakPrompt = useCallback(async (message, language = detLang) => {
    if (!message) return;
    const request = ++speechRequestRef.current;
    setVoiceLoading(true);
    setSpeaking(false);
    const started = await voiceAssistant.speak(
      message,
      speechCodeForLanguage(language),
      () => { if (request === speechRequestRef.current) { setSpeaking(false); setVoiceLoading(false); } },
      { preferNeural: true, neuralTimeoutMs: 6000 },
    );
    if (request !== speechRequestRef.current) return;
    setVoiceLoading(false);
    setSpeaking(Boolean(started));
  }, [detLang]);

  // Language belongs to the user, not the transcription engine. Re-localize
  // the current prompt without submitting an answer or resetting saved facts.
  useEffect(() => {
    if (step !== 2 || !interview || interviewLocale === answerLocale || loading) return undefined;
    let cancelled = false;
    voiceAssistant.stopSpeaking();
    speechRequestRef.current += 1;
    setSpeaking(false); setVoiceLoading(false); setLanguageChanging(true);
    api.continueProductInterview({
      utterance: '', conversation_transcript: transcript,
      language: detLang, detected_objects: imgData?.detected_objects || [],
      known_attributes: attrs || {}, cost_inputs: costs, last_question_key: null,
    }).then(result => {
      if (cancelled) return;
      lastAutoSpokenQuestionRef.current = '';
      setInterview(result);
      setInterviewLocale(answerLocale);
    }).catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLanguageChanging(false); });
    return () => { cancelled = true; };
  }, [answerLocale, detLang, step, interviewLocale, loading, interview, transcript, imgData, attrs, costs]);

  useEffect(() => () => { speechRequestRef.current += 1; voiceAssistant.stopSpeaking(); }, []);

  // Play a question only after its page is mounted and the loading screen has
  // disappeared. Starting speech inside the API handler raced the render and
  // could be dropped by browser autoplay handling even though the question was
  // visible a moment later.
  useEffect(() => {
    const message = interview?.assistant_message;
    if (step !== 2 || loading || languageChanging || interviewLocale !== answerLocale || !message) return undefined;

    const questionKey = [interview?.question_number || 0, detLang, message].join('|');
    if (lastAutoSpokenQuestionRef.current === questionKey) return undefined;
    const timer = window.setTimeout(() => {
      lastAutoSpokenQuestionRef.current = questionKey;
      speakPrompt(message, detLang);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [step, loading, languageChanging, interviewLocale, answerLocale, interview?.assistant_message, interview?.question_number, detLang, speakPrompt]);

  const enhancePhotos = async (fileList) => {
    const files = Array.from(fileList || []).slice(0, MAX_PRODUCT_IMAGES - images.length);
    if (!files.length) return;
    setLoading(true); setError(null);
    setLoadMsg(files.length > 1 ? `Enhancing ${files.length} product photos…` : 'Removing the background and creating your studio photo…');
    try {
      const enhanced = [];
      for (let index = 0; index < files.length; index += 1) {
        setLoadMsg(`Enhancing photo ${index + 1} of ${files.length}…`);
        enhanced.push(await api.enhanceImage(files[index], backgroundStyle, backgroundStyle === 'custom' ? customBackgroundFile : null));
      }
      clearQuestionFlow();
      setImages(current => [...current, ...enhanced].slice(0, MAX_PRODUCT_IMAGES));
      setActiveImageIndex(images.length);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setLoadMsg(''); }
  };

  const enhancePhoto = (file) => enhancePhotos(file ? [file] : []);

  const handleImageUpload = (e) => {
    enhancePhotos(e.target.files);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(current => current.filter((_, imageIndex) => imageIndex !== index));
    setActiveImageIndex(current => Math.max(0, Math.min(current, images.length - 2)));
  };

  const makePrimary = (index) => {
    if (index === 0) return;
    setImages(current => [current[index], ...current.filter((_, imageIndex) => imageIndex !== index)]);
    setActiveImageIndex(0);
  };

  const openBackgroundPicker = (index = null) => {
    setEditingBackgroundIndex(index);
    setBackgroundPanelOpen(true);
  };

  const applyBackground = async (style, file = null) => {
    if (editingBackgroundIndex === null) {
      setBackgroundStyle(style);
      setCustomBackgroundFile(style === 'custom' ? file : null);
      if (customBackgroundPreview) URL.revokeObjectURL(customBackgroundPreview);
      setCustomBackgroundPreview(style === 'custom' && file ? URL.createObjectURL(file) : '');
      setBackgroundPanelOpen(false);
      return;
    }
    const index = editingBackgroundIndex;
    const image = images[index];
    if (!image) return;
    setChangingImageIndex(index); setError(null);
    try {
      const updated = await api.changeImageBackground(image.original_image_url, style, file);
      setImages(current => current.map((item, imageIndex) => imageIndex === index ? updated : item));
      setBackgroundPanelOpen(false);
      setEditingBackgroundIndex(null);
    } catch (e) { setError(e.message); }
    finally { setChangingImageIndex(null); }
  };

  const handleCustomBackground = (event) => {
    const file = event.target.files?.[0];
    if (file) applyBackground('custom', file);
    event.target.value = '';
  };

  const beginInterview = async () => {
    if (!imgData) return;
    voiceAssistant.prepareSpeech();
    setLoading(true); setError(null);
    setLoadMsg('Preparing your first simple question…');
    try {
      const result = await api.continueProductInterview({
        utterance: '',
        conversation_transcript: '',
        language: detLang,
        detected_objects: imgData?.detected_objects || [],
        known_attributes: {},
        cost_inputs: {},
        last_question_key: null,
        artisan_name: artisanName,
      });
      setInterview(result);
      setInterviewLocale(answerLocale);
      setAttrs(result.attributes);
      setCosts({ ...result.cost_inputs, production_time: result.attributes.production_time || '' });
      setInterviewTurns([{ role: 'assistant', text: result.assistant_message }]);
      setQuestionHistory([]);
      setTypedAnswer('');
      setPendingAnswer(null);
      setStep(2);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setLoadMsg(''); }
  };

  const captureVoiceAnswer = async (blob, filename, spokenText = null, spokenLanguage = null) => {
    setLoading(true); setError(null);
    setLoadMsg('Checking the words we heard…');
    try {
      let text = spokenText;
      let language = spokenLanguage || detLang;
      if (!text) {
        const result = await api.transcribeAudio(blob, language, filename);
        text = result.transcript;
        language = result.detected_language || language;
      }
      if (!String(text || '').trim()) throw new Error('We could not hear an answer. Please try again slowly.');
      setPendingAnswer({ text: String(text).trim(), language });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setLoadMsg(''); }
  };

  const submitInterviewAnswer = async (answerOverride = null, languageOverride = null) => {
    const text = String(answerOverride || pendingAnswer?.text || typedAnswer || '').trim();
    const lang = languageOverride || detLang;
    if (!text) return;
    voiceAssistant.prepareSpeech();
    setLoading(true); setError(null);
    setLoadMsg('Saving your answer and preparing the next step…');
    try {
      const previousTranscript = transcript;
      const fullTranscript = [previousTranscript, text].filter(Boolean).join('\n');
      setTxt(fullTranscript);

      const result = await api.continueProductInterview({
        utterance: text,
        conversation_transcript: previousTranscript,
        language: lang,
        detected_objects: imgData?.detected_objects || [],
        known_attributes: attrs || {},
        cost_inputs: costs,
        last_question_key: interview?.next_question_key || null,
      });
      const mergedCosts = {
        ...result.cost_inputs,
        production_time: result.attributes.production_time || result.cost_inputs.production_time || '',
      };
      setQuestionHistory(history => [...history, {
        interview,
        attrs,
        costs,
        transcript: previousTranscript,
        interviewTurns,
        answer: text,
        language: lang,
        locale: answerLocale,
      }]);
      setInterview(result);
      setInterviewLocale(answerLocale);
      setAttrs(result.attributes);
      setCosts(mergedCosts);
      setInterviewTurns(turns => [...turns, { role: 'artisan', text }, { role: 'assistant', text: result.assistant_message }]);
      setTypedAnswer('');
      setPendingAnswer(null);

      if (result.status === 'ready_for_pricing') {
        setLoadMsg('Generating a verified bilingual marketplace listing...');
        const l = await api.generateListing(result.attributes, artisanName, detLang);
        setListing(l);
        setLoadMsg('Pricing AI: Blending confirmed costs with regional market benchmarks...');
        const pr = await api.calculatePrice({
          ...mergedCosts,
          category: result.attributes.category,
          craft_type: result.attributes.craft_type,
          material: result.attributes.material,
          // The pricing assistant reads the enhanced photo and the artisan's
          // own words, not just the costs.
          image_url: imgData?.enhanced_image_url || imgData?.original_image_url,
          description: result.attributes.artisan_description,
          dimensions: result.attributes.dimensions,
        });
        setPricing(pr);
        setStep(3);
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setLoadMsg(''); }
  };

  const goToPreviousQuestion = () => {
    voiceAssistant.stopSpeaking();
    setSpeaking(false);
    const previous = questionHistory[questionHistory.length - 1];
    if (!previous) {
      clearQuestionFlow();
      setStep(1);
      return;
    }
    setQuestionHistory(history => history.slice(0, -1));
    setInterview(previous.interview);
    setAttrs(previous.attrs);
    setCosts(previous.costs);
    setTxt(previous.transcript);
    setInterviewTurns(previous.interviewTurns);
    setInterviewLocale(previous.locale || 'en');
    setTypedAnswer(previous.answer || '');
    setPendingAnswer(null);
    lastAutoSpokenQuestionRef.current = '';
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!artisanId) {
      setError('No artisan profile is available. Create an artisan profile before submitting a listing.');
      return;
    }
    if (!imgData?.enhanced_image_url || !pricing?.suggested_price) {
      setError('A product photo and a price are needed before sending for review.');
      return;
    }
    setLoading(true);
    setLoadMsg('Submitting to Admin Approval Queue...');
    try {
      const payload = {
        artisan_id: artisanId,
        original_image: imgData.original_image_url,
        enhanced_image: imgData.enhanced_image_url,
        gallery: images.slice(1).map(image => ({
          original_image_url: image.original_image_url,
          enhanced_image_url: image.enhanced_image_url,
          background_style: image.background_style || backgroundStyle,
        })),
        background_style: imgData.background_style || backgroundStyle,
        transcript, detected_language: detLang,
        product_name: attrs?.product_name || listing?.title_en,
        category: attrs?.category || 'Handloom & Textiles',
        material: attrs?.material || 'Natural Fiber',
        craft_type: attrs?.craft_type || 'Handcrafted',
        color: attrs?.color || 'Natural',
        technique: attrs?.technique || 'Handmade',
        dimensions: attrs?.dimensions || 'Standard',
        production_time: attrs?.production_time || costs.production_time,
        region: attrs?.region || 'India',
        title: listing?.title_en || attrs?.product_name,
        title_hindi: listing?.title_hi,
        title_telugu: listing?.title_te,
        short_description: listing?.short_desc_en,
        short_description_hindi: listing?.short_desc_hi,
        short_description_telugu: listing?.short_desc_te,
        description: listing?.description_en,
        description_hindi: listing?.description_hi,
        description_telugu: listing?.description_te,
        specifications: listing?.specifications || [],
        keywords: listing?.keywords || [],
        material_cost: costs.material_cost,
        labor_cost: costs.labor_cost,
        packaging_cost: costs.packaging_cost,
        total_cost: pricing?.total_cost || (costs.material_cost + costs.labor_cost + costs.packaging_cost),
        minimum_price: pricing?.minimum_sustainable_price,
        recommended_min_price: pricing?.recommended_min_price,
        recommended_max_price: pricing?.recommended_max_price,
        pricing_explanation: pricing,
        suggested_price: pricing.suggested_price,
        stock_quantity: stockQuantity,
        status: 'Pending Approval',
      };
      const result = await api.createProduct(payload);
      setProductId(result.id);
      setSubmitted(true);
      if (onProductCreated) onProductCreated(result);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setLoadMsg(''); }
  };

  const reset = () => {
    if (customBackgroundPreview) URL.revokeObjectURL(customBackgroundPreview);
    setStep(1); setImages([]); setActiveImageIndex(0); setBackgroundStyle('warm-studio'); setCustomBackgroundFile(null); setCustomBackgroundPreview(''); setBackgroundPanelOpen(false); setEditingBackgroundIndex(null); setTxt(''); setAttrs(null); setListing(null); setPricing(null); setStockQuantity(1); setSubmitted(false); setProductId(null); setError(null);
    setCosts({ material_cost: null, labor_cost: null, packaging_cost: null, production_time: '' });
    setInterview(null); setInterviewTurns([]); setQuestionHistory([]); setTypedAnswer(''); setPendingAnswer(null);
  };

  const listingField = (base) => listing?.[`${base}_${listLang}`] || listing?.[`${base}_en`] || '';
  // Search-engine copy follows the preview language where we have it.
  const seoFields = {
    title: listing?.[`seo_title_${listLang}`] || listing?.seo_title_en || '',
    meta: listing?.[`meta_description_${listLang}`] || listing?.meta_description_en || '',
    keywords: (listLang === 'hi' ? listing?.keywords_hi : listing?.keywords) || listing?.keywords || [],
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl py-6">
        <div className="card overflow-hidden text-center">
          <div className="bg-brand-900 px-6 py-10 text-white">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-8 ring-white/5"><CheckCircle2 className="h-9 w-9 text-clay-200" /></span>
            <h2 className="mt-5 text-2xl font-semibold text-white">{t('Sent for review')}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-brand-100">{t('Our team checks every listing before it goes live. You can follow its status in Products.')}</p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 rounded-xl border border-line bg-paper-50 p-4 text-left">
              {imgData?.enhanced_image_url && <img src={imgData.enhanced_image_url} alt="" className="h-16 w-16 rounded-lg bg-white object-contain p-1" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-ink-950">{listing?.title_en || attrs?.product_name}</p>
                <p className="text-xs text-ink-500">#{productId} · {stockQuantity} {t('units')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-500">{t('Price')}</p>
                <p className="text-lg font-semibold tabular-nums text-ink-950">₹{Number(pricing?.suggested_price || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <button type="button" onClick={reset} className="btn btn-secondary"><Plus className="h-4 w-4" />{t('Create another')}</button>
              {onViewProducts && <button type="button" onClick={onViewProducts} className="btn btn-primary">{t('View my products')}<ArrowRight className="h-4 w-4" /></button>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <nav className="card p-3 sm:p-3" aria-label={t('Listing steps')}>
        {/* A phone shows where you are and how far is left; the five-stop rail
            needs room the screen does not have. */}
        <div className="sm:hidden">
          <div className="flex items-baseline justify-between gap-3">
            <p className="min-w-0 text-[15px] font-semibold text-ink-950">{t(STEPS[step - 1]?.label || '')}</p>
            <p className="flex-shrink-0 text-xs font-semibold tabular-nums text-ink-500">
              {t('Step')} {step} {t('of')} {STEPS.length}
            </p>
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-ink-500">{t(STEPS[step - 1]?.sub || '')}</p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-paper-200" role="presentation">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-500"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
        <ol className="hidden items-center gap-1 overflow-x-auto scrollbar-none sm:flex">
          {STEPS.map((s, idx) => {
            const done = step > s.n;
            const cur = step === s.n;
            return (
              <React.Fragment key={s.n}>
                <li className="flex-shrink-0">
                  <button
                    type="button"
                    aria-current={cur ? 'step' : undefined}
                    disabled={step <= s.n || loading}
                    onClick={() => { if (s.n === 2) goToPreviousQuestion(); else setStep(s.n); }}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition ${cur ? 'bg-brand-50' : done ? 'hover:bg-paper-200' : ''} disabled:cursor-default`}
                  >
                    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${done ? 'bg-brand-700 text-white' : cur ? 'bg-brand-600 text-white ring-4 ring-brand-600/15' : 'bg-paper-200 text-ink-500'}`}>
                      {done ? <Check className="h-4 w-4" /> : s.n}
                    </span>
                    <span className="hidden md:block">
                      <span className={`block text-[13px] font-semibold ${cur || done ? 'text-ink-950' : 'text-ink-500'}`}>{t(s.label)}</span>
                      <span className="block text-xs text-ink-500">{t(s.sub)}</span>
                    </span>
                  </button>
                </li>
                {idx < STEPS.length - 1 && <li aria-hidden="true" className={`h-px min-w-[16px] flex-1 ${step > s.n ? 'bg-brand-600' : 'bg-line-strong'}`} />}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>

      {cameraOpen && (
        <CameraCapture
          language={detLang}
          onCapture={enhancePhoto}
          onClose={() => setCameraOpen(false)}
        />
      )}

      {error && <Notice tone="error" onDismiss={() => setError(null)}>{t(error)}</Notice>}

      {loading && (
        <div className="card flex flex-col items-center px-6 py-16 text-center" role="status" aria-live="polite" aria-busy="true">
          <span className="relative flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-4 border-brand-100" />
            <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand-700" />
            <Sparkles className="h-6 w-6 text-clay-500" />
          </span>
          <p className="mt-5 text-base font-semibold text-ink-950">{t(loadMsg || 'Please wait…')}</p>
          <p className="mt-1 text-sm text-ink-500">{t('Please wait. We are preparing the next step for you.')}</p>
        </div>
      )}

      {/* STEP 1 — photo */}
      {step === 1 && !loading && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card card-pad">
            <span className="eyebrow"><Camera className="h-3.5 w-3.5" />{t('Step 1')}</span>
            <h2 className="mt-2 text-xl font-semibold text-ink-950">{t('Build your product photo gallery')}</h2>
            <p className="mt-1 text-sm text-ink-500">{t('Choose a background, then add up to six views so buyers can inspect every detail.')}</p>

            <div className="relative mt-5 rounded-2xl border border-line bg-paper-50">
              <button type="button" onClick={() => backgroundPanelOpen ? setBackgroundPanelOpen(false) : openBackgroundPicker(null)} className="flex w-full items-center gap-3 p-3.5 text-left" aria-expanded={backgroundPanelOpen}>
                <span className={`h-12 w-12 flex-none overflow-hidden rounded-xl border border-black/5 shadow-inner ${selectedBackground?.swatch || 'bg-paper-200'}`}>
                  {backgroundStyle === 'custom' && customBackgroundPreview && <img src={customBackgroundPreview} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-ink-500">{t('Background for next photo')}</span>
                  <span className="block truncate text-sm font-bold text-ink-950">{backgroundStyle === 'custom' ? t('Your uploaded background') : t(selectedBackground?.label || 'Warm studio')}</span>
                </span>
                <span className="hidden text-xs font-semibold text-brand-700 sm:block">{t('Choose or import')}</span>
                <ChevronDown className={`h-4 w-4 text-ink-500 transition ${backgroundPanelOpen ? 'rotate-180' : ''}`} />
              </button>

              {backgroundPanelOpen && (
                <div className="border-t border-line p-3.5" aria-busy={changingImageIndex !== null}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink-950">{editingBackgroundIndex === null ? t('Choose a background for the next photo') : `${t('Change background')} · ${t('Photo')} ${editingBackgroundIndex + 1}`}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{changingImageIndex !== null ? t('Please wait…') : t('Each product photo can use a different background and can be changed later.')}</p>
                    </div>
                    <button type="button" onClick={() => { setBackgroundPanelOpen(false); setEditingBackgroundIndex(null); }} aria-label={t('Close')} className="flex h-8 w-8 flex-none items-center justify-center rounded-full hover:bg-paper-200"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {BACKGROUND_OPTIONS.map(option => {
                      const selected = editingBackgroundIndex === null && backgroundStyle === option.id;
                      return (
                        <button key={option.id} type="button" disabled={changingImageIndex !== null} aria-pressed={selected} onClick={() => applyBackground(option.id)} className={`rounded-xl border p-1.5 text-left transition disabled:cursor-wait disabled:opacity-50 ${selected ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/15' : 'border-line bg-white hover:border-brand-300'}`}>
                          <span className={`relative block aspect-[5/3] rounded-lg border border-black/5 shadow-inner ${option.swatch}`}>{selected && <Check className="absolute right-1 top-1 h-4 w-4 rounded-full bg-brand-700 p-0.5 text-white" />}</span>
                          <span className="mt-1.5 block text-[11px] font-bold leading-tight text-ink-900">{t(option.label)}</span>
                        </button>
                      );
                    })}
                    <label className={`flex flex-col rounded-xl border border-dashed border-brand-400 bg-brand-50 p-1.5 text-brand-800 hover:bg-brand-100 ${changingImageIndex !== null ? 'cursor-wait opacity-50' : 'cursor-pointer'}`}>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCustomBackground} disabled={changingImageIndex !== null} className="sr-only" />
                      <span className="flex aspect-[5/3] items-center justify-center rounded-lg bg-white"><Upload className="h-5 w-5" /></span>
                      <span className="mt-1.5 text-[11px] font-bold leading-tight">{t('Import yours')}</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <label className="group mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-line-strong bg-paper-50 px-6 py-10 text-center transition hover:border-brand-600 hover:bg-brand-50/40 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/10">
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label={t('Add product photos')} onChange={handleImageUpload} disabled={images.length >= MAX_PRODUCT_IMAGES} className="sr-only" />
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-card transition group-hover:scale-105"><Upload className="h-6 w-6" /></span>
              <span className="mt-4 text-[15px] font-semibold text-ink-900">{t(images.length ? 'Add more product views' : 'Choose product photos')}</span>
              <span className="mt-1 text-xs text-ink-500">{images.length}/{MAX_PRODUCT_IMAGES} · {t('JPG, PNG or WebP — up to 15MB each')}</span>
            </label>

            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              disabled={images.length >= MAX_PRODUCT_IMAGES}
              className="btn btn-primary btn-lg mt-4 w-full rounded-2xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Camera className="h-5 w-5" />{cameraCopy.open}
            </button>

            {images.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink-900">{t('Your buyer gallery')}</p>
                  <p className="text-xs text-ink-500">{t('Tap a photo to preview')}</p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {images.map((image, index) => (
                    <div key={image.enhanced_image_url} className={`group relative overflow-hidden rounded-2xl border-2 bg-paper-100 ${activeImageIndex === index ? 'border-brand-600' : 'border-transparent'}`}>
                      <button type="button" onClick={() => setActiveImageIndex(index)} className="block aspect-square w-full p-1.5">
                        <img src={image.enhanced_image_url} alt={`${t('Product view')} ${index + 1}`} className="h-full w-full rounded-xl object-contain" />
                      </button>
                      <span className="absolute left-2 top-2 rounded-full bg-brand-950/80 px-2 py-1 text-[10px] font-bold text-white">{index === 0 ? t('Main') : index + 1}</span>
                      <button type="button" onClick={() => openBackgroundPicker(index)} disabled={changingImageIndex !== null} title={t('Change background')} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-brand-700 shadow-card disabled:opacity-50">
                        <Palette className={`h-3.5 w-3.5 ${changingImageIndex === index ? 'animate-pulse' : ''}`} />
                      </button>
                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                        {index > 0 && <button type="button" onClick={() => makePrimary(index)} title={t('Make main photo')} className="flex h-7 items-center rounded-full bg-white px-2 text-[10px] font-bold text-brand-700 shadow-card">{t('Main')}</button>}
                        <button type="button" onClick={() => removeImage(index)} title={t('Remove photo')} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-rose-700 shadow-card"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                  {images.length < MAX_PRODUCT_IMAGES && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line-strong bg-paper-50 text-ink-500 hover:border-brand-500 hover:text-brand-700">
                      <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="sr-only" />
                      <ImagePlus className="h-5 w-5" /><span className="mt-1 text-[11px] font-semibold">{t('Add views')}</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-line bg-paper-50 p-4">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
                <Globe className="h-4 w-4 text-clay-500" />{questionUi.languageLabel}
              </p>
              <p className="mt-1 text-sm text-ink-500">{questionUi.answerChoice}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SELLER_LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.locale}
                    type="button"
                    aria-pressed={answerLocale === option.locale}
                    onClick={() => setAnswerLocale(option.locale)}
                    className={`rounded-full border px-4 py-2 text-[15px] font-semibold transition ${
                      answerLocale === option.locale
                        ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
                        : 'border-line-strong bg-white text-ink-700 hover:border-brand-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <ul className="mt-5 grid gap-2 text-sm text-ink-600">
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />{t('Choose a clear photo with the whole product visible.')}</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />{t('Daylight near a window works best.')}</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />{t('Nothing is submitted until you review and confirm.')}</li>
            </ul>

            {imgData && (
              <button type="button" onClick={beginInterview} className="btn btn-primary btn-lg mt-6 w-full">
                {t('Next: Answer simple questions')}<ArrowRight className="h-5 w-5" />
              </button>
            )}
          </section>

          <section className="card overflow-hidden">
            {activeImage ? (
              <BeforeAfterSlider originalUrl={activeImage.original_image_url} enhancedUrl={activeImage.enhanced_image_url} title={`${t('Photo preview')} · ${activeImageIndex + 1}/${images.length}`} />
            ) : (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center bg-brand-900 px-6 text-center text-white">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10"><Sparkles className="h-7 w-7 text-clay-200" /></span>
                <p className="mt-4 text-base font-semibold">{t('Your enhanced photo will appear here')}</p>
                <p className="mt-1.5 max-w-xs text-sm text-brand-200">{t('We remove the background and balance the light so your craft looks its best.')}</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* STEP 2 — guided questions */}
      {step === 2 && !loading && (
        <div className="mx-auto max-w-3xl space-y-4" data-testid="guided-question-page">
          <section className="card overflow-hidden" aria-live="polite">
            <div className="flex items-center justify-between gap-3 bg-brand-600 px-5 py-3 text-white">
              <span className="flex items-center gap-2.5 text-sm font-semibold">
                <MessageSquare className="h-[18px] w-[18px]" />
                {questionUi.question} {interview?.question_number || 1} / {interview?.total_questions || 7}
              </span>
              <span className="flex items-center gap-1.5" aria-hidden="true">
                {Array.from({ length: interview?.total_questions || 7 }, (_, index) => (
                  <span key={index} className={`h-2 rounded-full transition-all ${index < (interview?.answered_count ?? 0) ? 'w-2 bg-clay-400' : index === (interview?.answered_count ?? 0) ? 'w-6 bg-white' : 'w-2 bg-white/35'}`} />
                ))}
              </span>
            </div>

            <div className="p-5 sm:p-7">
              {languageChanging || interviewLocale !== answerLocale ? (
                <p role="status" className="text-lg text-ink-500">{t('Updating the question language…')}</p>
              ) : (
                <>
                  <h2 className="text-2xl font-extrabold leading-snug text-ink-950 sm:text-[28px]" data-testid="current-question">
                    {interview?.question_title || interview?.assistant_message}
                  </h2>
                  {interview?.question_help && <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{interview.question_help}</p>}
                </>
              )}

              <button
                type="button"
                aria-pressed={speaking}
                aria-busy={voiceLoading}
                disabled={languageChanging || interviewLocale !== answerLocale}
                onClick={() => {
                  if (speaking || voiceLoading) { voiceAssistant.stopSpeaking(); setSpeaking(false); setVoiceLoading(false); }
                  else speakPrompt(interview?.assistant_message, detLang);
                }}
                className="btn btn-secondary mt-4 rounded-full"
              >
                {speaking || voiceLoading ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {voiceLoading ? questionUi.preparingVoice : speaking ? questionUi.stopQuestion : questionUi.listenQuestion}
              </button>

              {interview?.status === 'needs_confirmation' && interview?.summary_items?.length > 0 && (
                <dl className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line">
                  {interview.summary_items.filter((item) => item.value).map((item) => (
                    <div key={item.label} className="grid grid-cols-[42%_1fr] gap-3 bg-white px-4 py-3 text-[15px]">
                      <dt className="text-ink-500">{item.label}</dt>
                      <dd className="font-semibold text-ink-950">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </section>

          {interview?.status !== 'needs_confirmation' && !pendingAnswer && (
            <VoiceRecorder
              onAudioRecorded={captureVoiceAnswer}
              isProcessing={loading || languageChanging}
              initialLanguage={speechCodeForLanguage(detLang)}
              onLanguageChange={(value) => setAnswerLocale(localeForLanguage(value))}
              languageOptionsOverride={SELLER_LANGUAGE_OPTIONS.map((item) => ({ code: item.code, name: item.name, label: item.label }))}
              onRecordingStart={() => { setSpeaking(false); setVoiceLoading(false); }}
            />
          )}

          {interview?.status !== 'needs_confirmation' && (pendingAnswer ? (
            <section className="card card-pad border-emerald-300">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{questionUi.heard}</p>
              <p className="mt-2 rounded-xl bg-emerald-50 p-4 text-lg font-medium leading-relaxed text-ink-950">“{pendingAnswer.text}”</p>
              <p className="mt-2 text-sm text-ink-500">{questionUi.checkAnswer}</p>
              <button type="button" onClick={() => setPendingAnswer(null)} className="btn btn-secondary mt-3 rounded-full"><RefreshCw className="h-4 w-4" />{questionUi.recordAgain}</button>
            </section>
          ) : (
            <section className="card card-pad">
              <label htmlFor="typed-answer" className="label text-[15px]">{questionUi.orType}</label>
              {isAmountQuestion ? (
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-ink-500">₹</span>
                  <input
                    id="typed-answer"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={typedAnswer}
                    onChange={(event) => setTypedAnswer(event.target.value.replace(/[^\d.]/g, ''))}
                    onKeyDown={(event) => { if (event.key === 'Enter' && typedAnswer.trim()) submitInterviewAnswer(); }}
                    placeholder={interview?.placeholder || questionUi.placeholder}
                    className="field py-4 pl-10 text-2xl font-bold tabular-nums"
                  />
                </div>
              ) : (
                <input
                  id="typed-answer"
                  value={typedAnswer}
                  onChange={(event) => setTypedAnswer(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter' && typedAnswer.trim()) submitInterviewAnswer(); }}
                  placeholder={interview?.placeholder || questionUi.placeholder}
                  className="field py-3.5 text-lg"
                />
              )}

              {interview?.question_examples?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{questionUi.tapExample}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {interview.question_examples.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setTypedAnswer(example)}
                        className="rounded-full border border-line bg-paper-50 px-3.5 py-2 text-left text-sm text-ink-700 transition hover:border-brand-600 hover:bg-brand-50 hover:text-brand-700"
                      >
                        {isAmountQuestion ? `₹${example}` : example}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ))}

          <nav className="sticky bottom-3 z-10 grid grid-cols-[auto_1fr] gap-3 rounded-2xl border border-line bg-white/95 p-3 shadow-lift backdrop-blur" aria-label={t('Question navigation')}>
            <button type="button" onClick={goToPreviousQuestion} className="btn btn-secondary btn-lg rounded-full"><ArrowLeft className="h-5 w-5" /><span className="hidden sm:inline">{questionUi.previous}</span></button>
            <button
              type="button"
              onClick={() => (interview?.status === 'needs_confirmation' ? submitInterviewAnswer(confirmationAnswerForLanguage(detLang), detLang) : submitInterviewAnswer())}
              disabled={languageChanging || interviewLocale !== answerLocale || (interview?.status !== 'needs_confirmation' && !pendingAnswer?.text && !typedAnswer.trim())}
              className={`btn btn-lg rounded-full ${interview?.status === 'needs_confirmation' ? 'btn-success' : 'btn-primary'}`}
            >
              <span className="truncate">{interview?.status === 'needs_confirmation' ? questionUi.confirm : questionUi.next}</span><ArrowRight className="h-5 w-5 flex-shrink-0" />
            </button>
          </nav>
        </div>
      )}

      {/* STEPS 3 & 4 — review and price */}
      {(step === 3 || step === 4) && !loading && (
        <div className="space-y-6">
          {step === 3 && (
            <Notice tone="info"><p className="font-semibold">{t('Check your product details')}</p><p className="mt-0.5">{t('Nothing is submitted yet. Read the details below and use Edit if anything needs changing.')}</p></Notice>
          )}

          {step === 3 && (
            <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
              <div className="space-y-6">
                {imgData && <div className="card overflow-hidden"><BeforeAfterSlider originalUrl={imgData.original_image_url} enhancedUrl={imgData.enhanced_image_url} title={t('Photo preview')} /></div>}
                <section className="card card-pad">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950"><Mic className="h-4 w-4 text-clay-500" />{t('Your product story')}</h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (speaking) { voiceAssistant.stopSpeaking?.(); setSpeaking(false); }
                        else { setSpeaking(true); voiceAssistant.speak?.(transcript, speechCodeForLanguage(detLang), () => setSpeaking(false)); }
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}{speaking ? t('Stop') : t('Listen')}
                    </button>
                  </div>
                  <p className="mt-3 whitespace-pre-line rounded-xl bg-paper-100 p-4 text-sm italic leading-relaxed text-ink-700">“{transcript || t('Your answers will appear here.')}”</p>
                  <p className="mt-3 flex items-start gap-2 text-xs text-ink-500"><ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />{t('Details come only from your confirmed answers and photo. Nothing is invented.')}</p>
                </section>
              </div>

              <div className="space-y-6">
                <section className="card card-pad">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950"><Tag className="h-4 w-4 text-clay-500" />{t('Product details')}</h3>
                      <p className="text-sm text-ink-500">{t('Details from your photo and answers')}</p>
                    </div>
                    <button type="button" onClick={() => setEditMode(!editMode)} className={`btn btn-sm ${editMode ? 'btn-primary' : 'btn-secondary'}`}>
                      {editMode ? <Check className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}{editMode ? t('Save') : t('Edit')}
                    </button>
                  </div>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ['Product Name', 'product_name', true], ['Craft Type', 'craft_type'], ['Material', 'material'], ['Technique', 'technique'],
                      ['Dimensions', 'dimensions'], ['Production Time', 'production_time'], ['Region / Origin', 'region'], ['Color', 'color'],
                      ['Your Description', 'artisan_description', true],
                    ].map(([label, key, wide]) => (
                      <div key={key} className={wide ? 'sm:col-span-2' : ''}>
                        <dt className="text-xs font-medium text-ink-500">{t(label)}</dt>
                        {editMode ? (
                          <input aria-label={t(label)} value={attrs?.[key] || ''} onChange={(event) => setAttrs((current) => ({ ...current, [key]: event.target.value }))} className="field mt-1 py-2" />
                        ) : (
                          <dd className={`mt-0.5 text-sm ${attrs?.[key] ? 'font-medium text-ink-900' : 'text-ink-400'}`}>{attrs?.[key] || '—'}</dd>
                        )}
                      </div>
                    ))}
                  </dl>
                </section>

                {listing && (
                  <section className="card card-pad">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950"><Globe className="h-4 w-4 text-clay-500" />{t('Listing preview')}</h3>
                      <div className="flex rounded-lg bg-paper-200 p-0.5" role="group" aria-label={t('Listing language')}>
                        {[['en', 'English'], ['hi', 'हिन्दी'], ['te', 'తెలుగు']].map(([code, label]) => (
                          <button key={code} type="button" aria-pressed={listLang === code} onClick={() => setListLang(code)} className={`rounded-md px-3 py-1 text-xs font-semibold transition ${listLang === code ? 'bg-white text-ink-950 shadow-xs' : 'text-ink-500'}`}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 space-y-4">
                      <div><p className="text-xs font-medium text-ink-500">{t('Title')}</p><p className="mt-0.5 text-base font-semibold leading-snug text-ink-950">{listingField('title')}</p></div>
                      <div><p className="text-xs font-medium text-ink-500">{t('Summary')}</p><p className="mt-0.5 text-sm leading-relaxed text-ink-700">{listingField('short_desc')}</p></div>
                      <div><p className="text-xs font-medium text-ink-500">{t('Description')}</p><p className="mt-1 max-h-56 overflow-y-auto whitespace-pre-line rounded-xl bg-paper-100 p-4 text-sm leading-relaxed text-ink-700">{listingField('description')}</p></div>
                      {seoFields.title && (
                        <div className="rounded-xl border border-line bg-paper-50 p-4">
                          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
                            <Search className="h-3.5 w-3.5 text-brand-600" />{t('How buyers will find this')}
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-snug text-brand-800">{seoFields.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-ink-600">{seoFields.meta}</p>
                          {listing.slug && <p className="mt-1 truncate text-xs text-ink-400">craftlink.in/p/{listing.slug}</p>}
                        </div>
                      )}
                      {(seoFields.keywords?.length > 0 || listing.keywords?.length > 0) && (
                        <div>
                          <p className="text-xs font-medium text-ink-500">{t('Search words')}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {(seoFields.keywords?.length ? seoFields.keywords : listing.keywords).map((keyword) => (
                              <span key={keyword} className="rounded-full bg-paper-200 px-2.5 py-0.5 text-xs text-ink-600">#{keyword}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {listing.artisan_quote_original && listing.translation_engine !== 'same-language' && (
                        <p className="text-xs leading-relaxed text-ink-500">
                          {t('Translated from your own words in')} {listing.artisan_quote_language}: “{listing.artisan_quote_original}”
                        </p>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <PriceExplainerCard
                pricingData={pricing}
                currentCosts={costs}
                onUpdateCost={async (nextCosts) => {
                  setCosts(nextCosts);
                  try {
                    setPricing(await api.calculatePrice({ ...nextCosts, category: attrs?.category, craft_type: attrs?.craft_type, material: attrs?.material, image_url: imgData?.enhanced_image_url || imgData?.original_image_url, description: attrs?.artisan_description, dimensions: attrs?.dimensions }));
                  } catch (priceError) { setError(priceError.message); }
                }}
              />
              <aside className="space-y-4">
                <section className="card card-pad">
                  <label htmlFor="listing-stock" className="text-base font-semibold text-ink-950">{t('How many can you sell?')}</label>
                  <p className="mt-1 text-sm text-ink-500">{t('Buyers can never order more than this.')}</p>
                  <div className="mt-4 inline-flex items-center rounded-xl border border-line-strong">
                    <button type="button" onClick={() => setStockQuantity(Math.max(1, stockQuantity - 1))} className="flex h-12 w-12 items-center justify-center text-ink-700 hover:bg-paper-200" aria-label={t('Decrease quantity')}>−</button>
                    <input id="listing-stock" type="number" min="1" max="100000" value={stockQuantity} onChange={(event) => setStockQuantity(Math.max(1, Math.min(100000, Number(event.target.value || 1))))} className="h-12 w-20 border-x border-line-strong text-center text-lg font-semibold tabular-nums outline-none" />
                    <button type="button" onClick={() => setStockQuantity(Math.min(100000, stockQuantity + 1))} className="flex h-12 w-12 items-center justify-center text-ink-700 hover:bg-paper-200" aria-label={t('Increase quantity')}>+</button>
                  </div>
                </section>
                <section className="card card-pad">
                  <p className="text-sm text-ink-500">{t('You will list at')}</p>
                  <p className="text-3xl font-semibold tabular-nums text-ink-950">₹{Number(pricing?.suggested_price || 0).toLocaleString('en-IN')}</p>
                  <p className="mt-1 text-sm text-ink-500">{t('Stock')}: {stockQuantity}</p>
                </section>
              </aside>
            </div>
          )}

          <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/95 p-3 shadow-lift backdrop-blur">
            <button type="button" onClick={() => (step === 4 ? setStep(3) : goToPreviousQuestion())} className="btn btn-secondary">
              <ArrowLeft className="h-4 w-4" />{t(step === 4 ? 'Back to details' : 'Back to questions')}
            </button>
            {step === 3 ? (
              <button type="button" onClick={() => { setEditMode(false); setStep(4); }} className="btn btn-primary btn-lg">{t('Looks good — see price')}<ArrowRight className="h-4 w-4" /></button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading || !pricing?.suggested_price} className="btn btn-accent btn-lg"><Send className="h-4 w-4" />{t('Send for Review')}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
