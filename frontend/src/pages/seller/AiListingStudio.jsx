import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Camera, Check, CheckCircle2, Edit3, Globe, MessageSquare, Mic, Plus, RefreshCw, Send, ShieldCheck, Sparkles, Tag, Upload, Volume2, VolumeX } from 'lucide-react';
import { api } from '../../services/api';
import { voiceAssistant } from '../../services/voiceAssistant';
import BeforeAfterSlider from '../../components/BeforeAfterSlider';
import VoiceRecorder from '../../components/VoiceRecorder';
import PriceExplainerCard from '../../components/PriceExplainerCard';
import { Notice } from '../../components/ui';
import { useLanguage } from '../../context/LanguageContext';

const SELLER_LANGUAGE_OPTIONS = [
  { name: 'Hindi', code: 'hi-IN', label: 'हिन्दी' },
  { name: 'Telugu', code: 'te-IN', label: 'తెలుగు' },
  { name: 'English', code: 'en-IN', label: 'English' },
];

const speechCodeForLanguage = (language) => {
  const value = String(language || '').toLowerCase();
  if (value.startsWith('te') || value.includes('telugu') || value.includes('తెలుగు')) return 'te-IN';
  if (value.startsWith('hi') || value.includes('hindi') || value.includes('हिन्द')) return 'hi-IN';
  if (value.startsWith('ta') || value.includes('tamil')) return 'ta-IN';
  if (value.startsWith('bn') || value.includes('bengali')) return 'bn-IN';
  if (value.startsWith('mr') || value.includes('marathi')) return 'mr-IN';
  return 'en-IN';
};

const confirmationAnswerForLanguage = (language) => {
  const code = speechCodeForLanguage(language);
  if (code === 'te-IN') return 'అవును, ఈ సమాచారం మరియు ఖర్చులు సరైనవి.';
  if (code === 'hi-IN') return 'हाँ, यह जानकारी और लागत सही है।';
  return 'Yes, these details and costs are correct.';
};

const questionUiCopyFor = (language) => {
  const code = speechCodeForLanguage(language);
  if (code === 'te-IN') return {
    heading: 'ఒక సులభమైన ప్రశ్న',
    question: 'ప్రశ్న',
    of: 'లో',
    confirm: '✓ అవును, ఇది సరైనది — తర్వాత',
    heard: 'మేము విన్న సమాధానం',
    checkAnswer: 'ఇది సరైందైతే తర్వాత నొక్కండి. కాకపోతే మళ్లీ రికార్డ్ చేయండి.',
    recordAgain: 'మళ్లీ రికార్డ్ చేయండి',
    saveVoice: 'సమాధానం సేవ్ చేసి తర్వాత',
    orType: 'లేదా సమాధానం టైప్ చేయండి',
    placeholder: 'మీ భాషలో టైప్ చేయండి…',
    save: 'సేవ్ చేసి తర్వాత',
    back: 'ఫోటోకు తిరిగి వెళ్లండి',
    previous: 'వెనుకకు',
    next: 'తర్వాత',
    listenQuestion: 'ప్రశ్నను వినండి',
    stopQuestion: 'వాయిస్ ఆపండి',
    preparingVoice: 'సహజమైన వాయిస్ సిద్ధమవుతోంది…',
    questionHelp: 'ఈ ప్రశ్నను సహజమైన వాయిస్‌లో చదువుతాం. మళ్లీ వినాలంటే కింద ఉన్న బటన్ నొక్కండి.',
    answerChoice: 'మాట్లాడండి లేదా టైప్ చేయండి — మీకు సులభమైనది ఎంచుకోండి.',
    confirmationHelp: 'వివరాలను ఒకసారి చూసుకోండి. అన్నీ సరైతే నిర్ధారించి తర్వాత నొక్కండి. ఏదైనా మార్చాలంటే వెనుకకు నొక్కండి.',
    languageLabel: 'సమాధానం చెప్పే భాష',
  };
  if (code === 'hi-IN') return {
    heading: 'एक आसान सवाल',
    question: 'सवाल',
    of: 'में से',
    confirm: '✓ हाँ, यह सही है — आगे',
    heard: 'हमने यह जवाब सुना',
    checkAnswer: 'यह सही है तो आगे दबाएँ। नहीं तो फिर रिकॉर्ड करें।',
    recordAgain: 'फिर रिकॉर्ड करें',
    saveVoice: 'जवाब सहेजें और आगे जाएँ',
    orType: 'या जवाब लिखें',
    placeholder: 'अपनी भाषा में लिखें…',
    save: 'सहेजें और आगे जाएँ',
    back: 'फोटो पर वापस जाएँ',
    previous: 'पिछला',
    next: 'अगला',
    listenQuestion: 'सवाल सुनें',
    stopQuestion: 'आवाज़ रोकें',
    preparingVoice: 'स्वाभाविक आवाज़ तैयार हो रही है…',
    questionHelp: 'यह सवाल स्वाभाविक आवाज़ में अपने-आप पढ़ा जाएगा। दोबारा सुनने के लिए नीचे का बटन दबाएँ।',
    answerChoice: 'बोलें या लिखें — जो आपके लिए आसान हो उसे चुनें।',
    confirmationHelp: 'जानकारी एक बार देख लें। सब सही है तो पुष्टि करके आगे बढ़ें। बदलने के लिए पिछला दबाएँ।',
    languageLabel: 'जवाब की भाषा',
  };
  return {
    heading: 'One simple question',
    question: 'Question',
    of: 'of',
    confirm: '✓ Yes, this is correct — Next',
    heard: 'We heard your answer',
    checkAnswer: 'If this looks right, tap Next. Otherwise record it again.',
    recordAgain: 'Record again',
    saveVoice: 'Save answer & Next',
    orType: 'Or type the answer',
    placeholder: 'Type in your own language…',
    save: 'Save & Next',
    back: 'Back to Photo',
    previous: 'Previous',
    next: 'Next',
    listenQuestion: 'Listen to question',
    stopQuestion: 'Stop voice',
    preparingVoice: 'Preparing natural voice…',
    questionHelp: 'The assistant reads this aloud automatically. Tap below whenever you want to hear it again.',
    answerChoice: 'Speak or type — choose whichever is easier for you.',
    confirmationHelp: 'Check the details once. If everything is correct, confirm and continue. Use Previous to change an answer.',
    languageLabel: 'Answer language',
  };
};

// Guided listing flow: photo -> one question at a time -> review -> fair price -> submit.
export default function AiListingStudio({ onProductCreated, onViewProducts, artisanId, artisanName }) {
  const { locale, language, setLocale, t } = useLanguage();
  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [loadMsg, setLoadMsg]     = useState('');
  const [error, setError]         = useState(null);
  const [speaking, setSpeaking]   = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);

  const [imgData, setImgData]     = useState(null);
  const [transcript, setTxt]      = useState('');
  const detLang = language.name;
  const [interviewLocale, setInterviewLocale] = useState(locale);
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

  const STEPS = [
    { n: 1, label: 'Add Photo', sub: 'AI cleans the image' },
    { n: 2, label: 'Answer Questions', sub: 'One simple question at a time' },
    { n: 3, label: 'Check Details', sub: 'Review your words' },
    { n: 4, label: 'See Fair Price', sub: 'Clear cost calculation' },
    { n: 5, label: 'Send for Review', sub: 'Final submission' },
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
    if (step !== 2 || !interview || interviewLocale === locale || loading) return undefined;
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
      setInterviewLocale(locale);
    }).catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLanguageChanging(false); });
    return () => { cancelled = true; };
  }, [locale, detLang, step, interviewLocale, loading, interview, transcript, imgData, attrs, costs]);

  useEffect(() => () => { speechRequestRef.current += 1; voiceAssistant.stopSpeaking(); }, []);

  // Play a question only after its page is mounted and the loading screen has
  // disappeared. Starting speech inside the API handler raced the render and
  // could be dropped by browser autoplay handling even though the question was
  // visible a moment later.
  useEffect(() => {
    const message = interview?.assistant_message;
    if (step !== 2 || loading || languageChanging || interviewLocale !== locale || !message) return undefined;

    const questionKey = [interview?.question_number || 0, detLang, message].join('|');
    if (lastAutoSpokenQuestionRef.current === questionKey) return undefined;
    const timer = window.setTimeout(() => {
      lastAutoSpokenQuestionRef.current = questionKey;
      speakPrompt(message, detLang);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [step, loading, languageChanging, interviewLocale, locale, interview?.assistant_message, interview?.question_number, detLang, speakPrompt]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true); setError(null);
    setLoadMsg('AI Computer Vision: Removing background & enhancing studio quality...');
    try {
      const d = await api.enhanceImage(file);
      clearQuestionFlow();
      setImgData(d);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setLoadMsg(''); }
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
      });
      setInterview(result);
      setInterviewLocale(locale);
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
        locale,
      }]);
      setInterview(result);
      setInterviewLocale(locale);
      setAttrs(result.attributes);
      setCosts(mergedCosts);
      setInterviewTurns(turns => [...turns, { role: 'artisan', text }, { role: 'assistant', text: result.assistant_message }]);
      setTypedAnswer('');
      setPendingAnswer(null);

      if (result.status === 'ready_for_pricing') {
        setLoadMsg('Generating a verified bilingual marketplace listing...');
        const l = await api.generateListing(result.attributes, artisanName);
        setListing(l);
        setLoadMsg('Pricing AI: Blending confirmed costs with regional market benchmarks...');
        const pr = await api.calculatePrice({
          ...mergedCosts,
          category: result.attributes.category,
          craft_type: result.attributes.craft_type,
          material: result.attributes.material,
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
    setStep(1); setImgData(null); setTxt(''); setAttrs(null); setListing(null); setPricing(null); setStockQuantity(1); setSubmitted(false); setProductId(null); setError(null);
    setCosts({ material_cost: null, labor_cost: null, packaging_cost: null, production_time: '' });
    setInterview(null); setInterviewTurns([]); setQuestionHistory([]); setTypedAnswer(''); setPendingAnswer(null);
  };

  const listingField = (base) => listing?.[`${base}_${listLang}`] || listing?.[`${base}_en`] || '';

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
                <p className="truncate text-sm font-semibold text-ink-950">{listing?.title_en || attrs?.product_name}</p>
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
      <nav className="card p-2 sm:p-3" aria-label={t('Listing steps')}>
        <ol className="flex items-center gap-1 overflow-x-auto scrollbar-none">
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
            <h2 className="mt-2 text-xl font-semibold text-ink-950">{t('First, add one product photo')}</h2>
            <p className="mt-1 text-sm text-ink-500">{t('Do not worry about the background. AI will clean it.')}</p>

            <label className="group mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-line-strong bg-paper-50 px-6 py-10 text-center transition hover:border-brand-600 hover:bg-brand-50/40 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/10">
              <input type="file" accept="image/jpeg,image/png,image/webp" aria-label={t('Add Photo')} onChange={handleImageUpload} className="sr-only" />
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-card transition group-hover:scale-105"><Upload className="h-6 w-6" /></span>
              <span className="mt-4 text-[15px] font-semibold text-ink-900">{t(imgData ? 'Choose a different photo' : 'Tap here and choose a photo')}</span>
              <span className="mt-1 text-xs text-ink-500">{t('JPG, PNG or WebP — up to 15MB')}</span>
            </label>

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
            {imgData ? (
              <BeforeAfterSlider originalUrl={imgData.original_image_url} enhancedUrl={imgData.enhanced_image_url} title={t('Photo preview')} />
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
          <section className="card card-pad" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white"><MessageSquare className="h-5 w-5" /></span>
                <div>
                  <p className="text-base font-semibold text-ink-950">{questionUi.heading}</p>
                  <p className="text-sm text-ink-500">{questionUi.question} {interview?.question_number || 1} {questionUi.of} {interview?.total_questions || 7}</p>
                </div>
              </div>
              {interview?.turn_summary && <span className="hidden rounded-full bg-paper-200 px-3 py-1 text-xs font-medium text-ink-600 sm:block">{interview.turn_summary}</span>}
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-paper-200">
              <div className="h-full rounded-full bg-brand-700 transition-all duration-500" style={{ width: `${Math.max(4, (interview?.readiness_score || 0) * 100)}%` }} />
            </div>
            <div className="mt-6 rounded-2xl bg-brand-50 p-5 text-lg font-medium leading-relaxed text-ink-950 sm:text-xl" data-testid="current-question">
              {languageChanging || interviewLocale !== locale ? <span role="status" className="text-ink-500">{t('Updating the question language…')}</span> : interview?.assistant_message}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-500">{questionUi.questionHelp}</p>
              <button
                type="button"
                aria-pressed={speaking}
                aria-busy={voiceLoading}
                disabled={languageChanging || interviewLocale !== locale}
                onClick={() => {
                  if (speaking || voiceLoading) { voiceAssistant.stopSpeaking(); setSpeaking(false); setVoiceLoading(false); }
                  else speakPrompt(interview?.assistant_message, detLang);
                }}
                className="btn btn-secondary"
              >
                {speaking || voiceLoading ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {voiceLoading ? questionUi.preparingVoice : speaking ? questionUi.stopQuestion : questionUi.listenQuestion}
              </button>
            </div>
          </section>

          {interview?.status === 'needs_confirmation' ? (
            <Notice tone="success"><p className="font-semibold">{questionUi.heard}</p><p className="mt-0.5">{questionUi.confirmationHelp}</p></Notice>
          ) : (
            <p className="text-center text-sm font-medium text-ink-600">{questionUi.answerChoice}</p>
          )}

          {interview?.status !== 'needs_confirmation' && !pendingAnswer && (
            <VoiceRecorder
              onAudioRecorded={captureVoiceAnswer}
              isProcessing={loading || languageChanging}
              initialLanguage={speechCodeForLanguage(detLang)}
              onLanguageChange={(value) => setLocale(value)}
              languageOptionsOverride={SELLER_LANGUAGE_OPTIONS.map((item) => ({ code: item.code, name: item.name, label: item.label }))}
              onRecordingStart={() => { setSpeaking(false); setVoiceLoading(false); }}
            />
          )}

          {interview?.status !== 'needs_confirmation' && (pendingAnswer ? (
            <section className="card card-pad">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{questionUi.heard}</p>
              <p className="mt-2 rounded-xl bg-emerald-50 p-4 text-base font-medium leading-relaxed text-ink-950">“{pendingAnswer.text}”</p>
              <p className="mt-2 text-sm text-ink-500">{questionUi.checkAnswer}</p>
              <button type="button" onClick={() => setPendingAnswer(null)} className="btn btn-secondary mt-3"><RefreshCw className="h-4 w-4" />{questionUi.recordAgain}</button>
            </section>
          ) : (
            <section className="card card-pad">
              <label htmlFor="typed-answer" className="label">{questionUi.orType}</label>
              <input
                id="typed-answer"
                value={typedAnswer}
                onChange={(event) => setTypedAnswer(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter' && typedAnswer.trim()) submitInterviewAnswer(); }}
                placeholder={questionUi.placeholder}
                className="field py-3 text-base"
              />
            </section>
          ))}

          <nav className="sticky bottom-3 z-10 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white/95 p-3 shadow-lift backdrop-blur" aria-label={t('Question navigation')}>
            <button type="button" onClick={goToPreviousQuestion} className="btn btn-secondary btn-lg"><ArrowLeft className="h-5 w-5" />{questionUi.previous}</button>
            <button
              type="button"
              onClick={() => (interview?.status === 'needs_confirmation' ? submitInterviewAnswer(confirmationAnswerForLanguage(detLang), detLang) : submitInterviewAnswer())}
              disabled={languageChanging || interviewLocale !== locale || (interview?.status !== 'needs_confirmation' && !pendingAnswer?.text && !typedAnswer.trim())}
              className="btn btn-primary btn-lg"
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
                      {listing.keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">{listing.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-paper-200 px-2.5 py-0.5 text-xs text-ink-600">#{keyword}</span>)}</div>
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
                    setPricing(await api.calculatePrice({ ...nextCosts, category: attrs?.category, craft_type: attrs?.craft_type, material: attrs?.material }));
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
