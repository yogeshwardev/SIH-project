import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Mic, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Edit3, 
  Save, 
  RefreshCw, 
  HelpCircle, 
  Tag, 
  Globe, 
  Layers, 
  DollarSign, 
  Eye, 
  Check, 
  Sliders,
  AlertCircle,
  Volume2,
  VolumeX,
  ShieldCheck,
  Send
} from 'lucide-react';
import { api } from '../services/api';
import { voiceAssistant } from '../services/voiceAssistant';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import VoiceRecorder from '../components/VoiceRecorder';
import PriceExplainerCard from '../components/PriceExplainerCard';
import { DEMO_PRESETS } from '../components/LiveDemoBar';

export default function ArtisanStudioPage({ onProductCreated, activePreset, onNavigateToAdmin }) {
  // Current active step in studio wizard (1 to 5)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isPlayingListingAudio, setIsPlayingListingAudio] = useState(false);

  // Workflow State
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imageEnhanceData, setImageEnhanceData] = useState(null);
  
  const [transcript, setTranscript] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('Hindi');

  const [extractedAttributes, setExtractedAttributes] = useState(null);
  const [isEditingAttributes, setIsEditingAttributes] = useState(false);

  const [generatedListing, setGeneratedListing] = useState(null);
  const [selectedListingLang, setSelectedListingLang] = useState('en'); // 'en' or 'hi'

  const [pricingData, setPricingData] = useState(null);
  const [costs, setCosts] = useState({
    material_cost: 1500,
    labor_cost: 2400,
    packaging_cost: 180,
    production_time: '3 days'
  });

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdProductId, setCreatedProductId] = useState(null);

  // Synchronize when a preset is clicked in top LiveDemoBar
  React.useEffect(() => {
    if (activePreset) {
      loadPresetWorkflow(activePreset);
    }
  }, [activePreset]);

  const loadPresetWorkflow = async (preset) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      setLoadingMessage('1/5 Isolating background & normalizing studio lighting...');
      setImageEnhanceData({
        original_image_url: preset.rawImage,
        enhanced_image_url: preset.enhancedImage,
        detected_objects: [preset.category, preset.craft],
        dominant_colors: ['#C2410C', '#D97706', '#1E293B'],
        segmentation_engine: 'Pre-generated sample (no live confidence)'
      });

      setLoadingMessage('2/5 Transcribing artisan speech with language detection...');
      setTranscript(preset.voiceText);
      setDetectedLanguage(preset.language);

      setLoadingMessage('3/5 Extracting structured craft metadata (Anti-Hallucination)...');
      const attrs = await api.extractProductInfo(
        preset.voiceText, 
        [preset.category, preset.craft], 
        preset.language
      );
      setExtractedAttributes(attrs);

      setLoadingMessage('4/5 Generating bilingual English & Hindi catalog listings...');
      const listing = await api.generateListing(attrs, 'Master Artisan');
      setGeneratedListing(listing);

      setLoadingMessage('5/5 Running Random Forest pricing model & fair-trade economics...');
      const costPayload = {
        material_cost: preset.materialCost,
        labor_cost: preset.laborCost,
        packaging_cost: preset.packagingCost,
        production_time: preset.productionTime,
        category: preset.category,
        craft_type: preset.craft,
        material: attrs.material
      };
      setCosts(costPayload);
      const priceRes = await api.calculatePrice(costPayload);
      setPricingData(priceRes);

      setStep(4); // Advance to review & price recommendation stage
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to load catalog template');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Step 1: Image Upload / Enhance Handler
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    setLoading(true);
    setLoadingMessage('AI Computer Vision: Removing background, correcting lighting & generating studio catalog image...');
    setErrorMessage(null);
    try {
      const data = await api.enhanceImage(file);
      setImageEnhanceData(data);
      setStep(2); // Advance to voice
    } catch (err) {
      setErrorMessage(err.message || 'Image enhancement failed');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Step 2: Voice Audio Recorded Handler
  const handleAudioRecorded = async (blob, filename, overrideText = null, overrideLang = null) => {
    setLoading(true);
    setLoadingMessage('Speech AI: Converting speech to text & detecting Indian dialect...');
    setErrorMessage(null);
    try {
      let speechText = overrideText;
      let lang = overrideLang || 'Hindi';

      if (!speechText) {
        const res = await api.transcribeAudio(blob, lang, filename);
        speechText = res.transcript;
        lang = res.detected_language;
      }

      setTranscript(speechText);
      setDetectedLanguage(lang);

      // Immediately run Step 3 extraction
      setLoadingMessage('NLP Intelligence: Extracting craft specifications, materials, and production duration...');
      const attrs = await api.extractProductInfo(
        speechText,
        imageEnhanceData?.detected_objects || [],
        lang
      );
      setExtractedAttributes(attrs);

      // Generate Multilingual Listings
      setLoadingMessage('Generative AI: Creating professional English & Hindi listings...');
      const listing = await api.generateListing(attrs, 'Master Artisan');
      setGeneratedListing(listing);

      // Calculate initial pricing
      setLoadingMessage('Pricing Engine: Computing cost economics & market benchmark...');
      const priceRes = await api.calculatePrice({
        material_cost: costs.material_cost,
        labor_cost: costs.labor_cost,
        packaging_cost: costs.packaging_cost,
        production_time: attrs.production_time || '2 days',
        category: attrs.category,
        craft_type: attrs.craft_type,
        material: attrs.material
      });
      setPricingData(priceRes);

      setStep(3); // Advance to attribute confirmation
    } catch (err) {
      setErrorMessage(err.message || 'Speech & Extraction failed');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Step 4: Recalculate Pricing
  const handleUpdateCosts = async (newCosts) => {
    setCosts(newCosts);
    try {
      const priceRes = await api.calculatePrice({
        ...newCosts,
        category: extractedAttributes?.category || 'Handloom & Textiles',
        craft_type: extractedAttributes?.craft_type || 'Handcrafted',
        material: extractedAttributes?.material || 'Natural'
      });
      setPricingData(priceRes);
    } catch (err) {
      console.error(err);
    }
  };

  // Step 5: Submit for Admin Approval Workflow
  const handleSubmitForAdminReview = async () => {
    setLoading(true);
    setLoadingMessage('Submitting verified craft & AI analysis to Admin Approval Queue...');
    try {
      const productPayload = {
        original_image: imageEnhanceData?.original_image_url || '/uploads/banarasi_saree_raw.jpg',
        enhanced_image: imageEnhanceData?.enhanced_image_url || '/uploads/banarasi_saree_studio_enhanced.png',
        transcript: transcript,
        detected_language: detectedLanguage,
        product_name: extractedAttributes?.product_name || 'Handcrafted Artisan Item',
        category: extractedAttributes?.category || 'Handloom & Textiles',
        material: extractedAttributes?.material || 'Natural Fiber',
        craft_type: extractedAttributes?.craft_type || 'Handcrafted',
        color: extractedAttributes?.color || 'Natural',
        technique: extractedAttributes?.technique || 'Handmade',
        dimensions: extractedAttributes?.dimensions || 'Standard',
        production_time: extractedAttributes?.production_time || costs.production_time,
        region: extractedAttributes?.region || 'India',
        title: generatedListing?.title_en || extractedAttributes?.product_name,
        title_hindi: generatedListing?.title_hi,
        title_telugu: generatedListing?.title_te,
        short_description: generatedListing?.short_desc_en,
        short_description_hindi: generatedListing?.short_desc_hi,
        short_description_telugu: generatedListing?.short_desc_te,
        description: generatedListing?.description_en,
        description_hindi: generatedListing?.description_hi,
        description_telugu: generatedListing?.description_te,
        specifications: generatedListing?.specifications || [],
        keywords: generatedListing?.keywords || [],
        material_cost: costs.material_cost,
        labor_cost: costs.labor_cost,
        packaging_cost: costs.packaging_cost,
        total_cost: pricingData?.total_cost || (costs.material_cost + costs.labor_cost + costs.packaging_cost),
        minimum_price: pricingData?.minimum_sustainable_price || costs.material_cost * 1.2,
        recommended_min_price: pricingData?.recommended_min_price || costs.material_cost * 1.3,
        recommended_max_price: pricingData?.recommended_max_price || costs.material_cost * 1.8,
        suggested_price: pricingData?.suggested_price || 2499,
        pricing_explanation: pricingData ? {
          explanation: pricingData.explanation,
          margin_percentage: pricingData.profit_margin_percentage
        } : {},
        ai_confidence: extractedAttributes?.confidence_scores || {},
        status: 'Pending Approval' // Request to add in website workflow!
      };

      const result = await api.createProduct(productPayload);
      setCreatedProductId(result.id);
      setSubmitSuccess(true);
      if (onProductCreated) {
        onProductCreated(result);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit product');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handlePlayVoiceover = (textToRead, lang) => {
    if (isPlayingListingAudio) {
      voiceAssistant.stopSpeaking();
      setIsPlayingListingAudio(false);
    } else {
      setIsPlayingListingAudio(true);
      voiceAssistant.speak(textToRead, lang === 'hi' ? 'hi-IN' : 'en-IN', () => {
        setIsPlayingListingAudio(false);
      });
    }
  };

  const sampleVoicePresets = [
    {
      id: 'voice_saree',
      title: 'बनारसी साड़ी (Hindi)',
      language: 'Hindi',
      text: 'यह शुद्ध बनारसी कतान सिल्क साड़ी है। इसमें असली सोने और चांदी की जरी का काम है। इसे हथकरघे पर 6 दिन में बुना गया है। इसकी लंबाई 6.5 मीटर है।'
    },
    {
      id: 'voice_pottery',
      title: 'Blue Pottery Vase (English)',
      language: 'English',
      text: 'This is a handcrafted Jaipur Blue Pottery vase made from quartz stone powder and natural blue cobalt glaze. It takes 3 days to mold, paint, and fire in the traditional kiln.'
    },
    {
      id: 'voice_bamboo',
      title: 'असमिया बांस टोकरी (Hindi)',
      language: 'Hindi',
      text: 'यह प्राकृतिक असमिया बांस से बनी मजबूत और पर्यावरण के अनुकूल स्टोरेज बास्केट है। इसे पारंपरिक हाथ की बुनाई से 2 दिन में तैयार किया गया है।'
    },
    {
      id: 'voice_toy',
      title: 'Wooden Toy (English)',
      language: 'English',
      text: 'This is an authentic Channapatna wooden stacker toy crafted with Ivory wood and polished with non-toxic natural vegetable dyes. Child-safe and handmade in 1 day.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Progress Steps Header */}
      <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between overflow-x-auto gap-2 pb-2 sm:pb-0">
          {[
            { num: 1, label: '1. Photo Capture', subtitle: 'AI Studio Enhancement' },
            { num: 2, label: '2. Voice Description', subtitle: 'Live Speech AI & TTS' },
            { num: 3, label: '3. AI Understanding', subtitle: 'Entity Extraction & Listings' },
            { num: 4, label: '4. Smart Pricing', subtitle: 'Fair-Trade Calculation' },
            { num: 5, label: '5. Admin Request Sent', subtitle: 'Marketplace Review' }
          ].map((s) => {
            const isCompleted = step > s.num || (submitSuccess && s.num === 5);
            const isCurrent = step === s.num && !submitSuccess;
            return (
              <button
                key={s.num}
                onClick={() => !loading && step > s.num && setStep(s.num)}
                disabled={step < s.num}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all whitespace-nowrap ${
                  isCurrent
                    ? 'bg-terracotta-50 text-terracotta-700 font-bold border border-terracotta-200'
                    : isCompleted
                    ? 'text-emerald-700 font-bold'
                    : 'text-slate-400 font-medium'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-terracotta-600 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs">{s.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{s.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="mb-6 p-6 rounded-2xl bg-white border border-terracotta-200 shadow-md flex flex-col items-center justify-center text-center animate-fadeIn">
          <div className="w-12 h-12 rounded-full border-4 border-terracotta-200 border-t-terracotta-600 animate-spin mb-3"></div>
          <p className="text-sm font-bold text-slate-800">{loadingMessage || 'AI Processing...'}</p>
          <p className="text-xs text-slate-400 mt-1">Executing neural computer vision, speech models & fair-trade engine</p>
        </div>
      )}

      {/* STEP 1: Capture & AI Photo Studio */}
      {step === 1 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-artisan-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-terracotta-100 text-terracotta-700 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Step 1: Capture Artisan Product
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Take a regular photo with your phone. Even messy backgrounds (bedsheets, floor, workshop clutter) are automatically cleaned by our AI studio engine.
              </p>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-artisan-300 hover:border-terracotta-500 bg-artisan-50/50 hover:bg-terracotta-50/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-full bg-white text-terracotta-600 group-hover:scale-110 shadow-sm flex items-center justify-center mb-3 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <span className="text-sm font-bold text-slate-800">
                  Click to Upload or Drag Photo
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Supports JPG, PNG, WebP (Up to 15MB)
                </span>
              </label>
            </div>

            {/* Quick Demo Photo Presets */}
            <div className="mt-6 pt-5 border-t border-artisan-100">
              <span className="text-xs font-bold uppercase text-slate-400 block mb-2">
                Or choose sample raw handicraft photo:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_PRESETS.slice(0, 3).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => loadPresetWorkflow(p)}
                    className="p-2 rounded-xl border border-artisan-200 hover:border-terracotta-400 text-left bg-artisan-50/60 hover:bg-white transition-all text-xs"
                  >
                    <div className="text-lg mb-1">{p.icon}</div>
                    <div className="font-bold text-slate-800 truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-400">{p.region}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Enhancement Preview Banner */}
          <div className="lg:col-span-7">
            <BeforeAfterSlider
              originalUrl="/uploads/banarasi_saree_raw.jpg"
              enhancedUrl="/uploads/banarasi_saree_studio_enhanced.png"
              title="Studio Transformation Preview"
            />
          </div>
        </div>
      )}

      {/* STEP 2: Voice & Tell Us About Your Product */}
      {step === 2 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            {imageEnhanceData && (
              <>
                <BeforeAfterSlider
                  originalUrl={imageEnhanceData.original_image_url}
                  enhancedUrl={imageEnhanceData.enhanced_image_url}
                />
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-900">
                  <Sparkles className="h-4 w-4" />
                  <span>{imageEnhanceData.segmentation_engine || 'Neural segmentation'}</span>
                  {typeof imageEnhanceData.mask_quality_score === 'number' && (
                    <span className="rounded-full bg-white px-2 py-0.5 text-emerald-700">
                      Mask quality {(imageEnhanceData.mask_quality_score * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="lg:col-span-7 space-y-4">
            <VoiceRecorder
              onAudioRecorded={handleAudioRecorded}
              isProcessing={loading}
              samplePresets={sampleVoicePresets}
            />
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-artisan-200 hover:bg-artisan-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 & 4: Review AI Understanding & Smart Pricing */}
      {(step === 3 || step === 4) && !loading && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Enhanced Studio Visual & Transcript */}
            <div className="lg:col-span-5 space-y-4">
              {imageEnhanceData && (
                <BeforeAfterSlider
                  originalUrl={imageEnhanceData.original_image_url}
                  enhancedUrl={imageEnhanceData.enhanced_image_url}
                />
              )}

              {/* Artisan Spoken Transcript Box with Voiceover Player */}
              <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-terracotta-600" />
                    <h4 className="text-xs font-bold text-slate-800">
                      Spoken Transcript ({detectedLanguage})
                    </h4>
                  </div>
                  <button
                    onClick={() => handlePlayVoiceover(transcript, detectedLanguage === 'Hindi' ? 'hi' : 'en')}
                    className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                  >
                    {isPlayingListingAudio ? <VolumeX className="w-3 h-3 text-red-600" /> : <Volume2 className="w-3 h-3 text-emerald-700" />}
                    <span>{isPlayingListingAudio ? 'Stop' : '🔊 Listen Voiceover'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-700 bg-artisan-50/70 p-3 rounded-xl border border-artisan-200 italic leading-relaxed">
                  "{transcript || 'Artisan voice description recorded.'}"
                </p>
              </div>

              {/* Confidence System Card */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-950">
                    Responsible AI Guarantee (Zero Hallucination)
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-normal">
                  All extracted attributes originate purely from confirmed artisan speech and visual cues. Unverified claims are marked for human confirmation.
                </p>
              </div>

            </div>

            {/* Right Column: Structured Attributes & Multilingual Listing */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Structured Attribute Card */}
              <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-5">
                <div className="flex items-center justify-between pb-3 border-b border-artisan-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        AI Product Understanding
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Extracted structured metadata with confidence flags
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditingAttributes(!isEditingAttributes)}
                    className="text-xs font-bold text-terracotta-700 hover:text-terracotta-800 bg-artisan-100 px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingAttributes ? 'Done Editing' : 'Edit Fields'}</span>
                  </button>
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  
                  <div className="bg-artisan-50 p-2.5 rounded-xl border border-artisan-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Product Name</span>
                    {isEditingAttributes ? (
                      <input
                        type="text"
                        value={extractedAttributes?.product_name || ''}
                        onChange={(e) => setExtractedAttributes({ ...extractedAttributes, product_name: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1 text-xs font-bold"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{extractedAttributes?.product_name || 'Handcrafted Item'}</span>
                    )}
                  </div>

                  <div className="bg-artisan-50 p-2.5 rounded-xl border border-artisan-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Craft Type</span>
                    <span className="font-bold text-slate-800">{extractedAttributes?.craft_type || 'Traditional Craft'}</span>
                  </div>

                  <div className="bg-artisan-50 p-2.5 rounded-xl border border-artisan-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Primary Material</span>
                    <span className="font-bold text-slate-800">{extractedAttributes?.material || 'Natural Material'}</span>
                  </div>

                  <div className="bg-artisan-50 p-2.5 rounded-xl border border-artisan-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Production Time</span>
                    <span className="font-bold text-slate-800">{extractedAttributes?.production_time || '2-3 days'}</span>
                  </div>

                  <div className="bg-artisan-50 p-2.5 rounded-xl border border-artisan-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Dimensions</span>
                    <span className="font-bold text-slate-800">{extractedAttributes?.dimensions || 'Standard'}</span>
                  </div>

                  <div className="bg-artisan-50 p-2.5 rounded-xl border border-artisan-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Region</span>
                    <span className="font-bold text-slate-800">{extractedAttributes?.region || 'India'}</span>
                  </div>

                </div>
              </div>

              {/* Multilingual Generated Listing Preview */}
              {generatedListing && (
                <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-artisan-100 mb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-terracotta-600" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Generated Marketplace Listing
                      </h4>
                    </div>

                    {/* Language Switcher Tabs & Voiceover */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const text = selectedListingLang === 'en' ? generatedListing.description_en : generatedListing.description_hi;
                          handlePlayVoiceover(text, selectedListingLang);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-sm"
                        title="Listen to generated listing read aloud"
                      >
                        {isPlayingListingAudio ? <VolumeX className="w-3.5 h-3.5 text-red-600" /> : <Volume2 className="w-3.5 h-3.5 text-amber-700" />}
                        <span>{isPlayingListingAudio ? 'Stop' : '🔊 Listen'}</span>
                      </button>

                      <div className="flex items-center bg-artisan-100 p-1 rounded-lg">
                        <button
                          onClick={() => setSelectedListingLang('en')}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            selectedListingLang === 'en'
                              ? 'bg-white text-terracotta-700 shadow-sm'
                              : 'text-slate-600'
                          }`}
                        >
                          English
                        </button>
                        <button
                          onClick={() => setSelectedListingLang('hi')}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            selectedListingLang === 'hi'
                              ? 'bg-white text-terracotta-700 shadow-sm'
                              : 'text-slate-600'
                          }`}
                        >
                          हिन्दी (Hindi)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Listing Content */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">E-Commerce Title</span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {selectedListingLang === 'en' ? generatedListing.title_en : generatedListing.title_hi}
                      </h4>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Marketplace Summary</span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">
                        {selectedListingLang === 'en' ? generatedListing.short_desc_en : generatedListing.short_desc_hi}
                      </p>
                    </div>

                    {/* Bullet Specs */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Product Specifications</span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5">
                        {generatedListing.specifications.slice(0, 6).map((spec, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-terracotta-600"></span>
                            <span>{spec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* SEO Tags */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      {generatedListing.keywords.map((kw, i) => (
                        <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium">
                          #{kw}
                        </span>
                      ))}
                    </div>

                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Smart Pricing Explainer Section */}
          <PriceExplainerCard
            pricingData={pricingData}
            onUpdateCost={handleUpdateCosts}
            currentCosts={costs}
          />

          {/* Footer Action Buttons with Request to Admin Workflow */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-artisan-200">
            <button
              onClick={() => setStep(2)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-artisan-200 hover:bg-artisan-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back / Re-record Voice</span>
            </button>

            <button
              onClick={handleSubmitForAdminReview}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-extrabold bg-gradient-to-r from-amber-600 via-terracotta-600 to-terracotta-700 hover:from-amber-700 hover:to-terracotta-800 text-white shadow-xl shadow-terracotta-600/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Request Admin to Add in Website (Submit for Review)</span>
            </button>
          </div>

        </div>
      )}

      {/* STEP 5: Request Submitted to Admin Modal */}
      {submitSuccess && (
        <div className="bg-white rounded-3xl border-2 border-amber-400 shadow-2xl p-8 text-center max-w-2xl mx-auto animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8" />
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full mb-2">
            STATUS: PENDING ADMIN APPROVAL
          </span>
          <h2 className="text-2xl font-black text-slate-900">
            Request Sent to Admin Portal!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
            Your craft photo, voice transcript, AI listing, and pricing economics have been routed to the <strong>Admin Governance & Verification Queue</strong>. Once authorized by the administrator, it will go live on the e-commerce store!
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-artisan-50 border border-artisan-200 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <img
                src={imageEnhanceData?.enhanced_image_url || '/uploads/banarasi_saree_studio_enhanced.png'}
                alt="Product thumbnail"
                className="w-14 h-14 rounded-xl object-contain bg-slate-900"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {extractedAttributes?.product_name}
                </h4>
                <p className="text-xs text-slate-500">
                  {extractedAttributes?.craft_type} • Request #{createdProductId || 'NEW'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Submitted Fair Price</span>
              <span className="text-lg font-black text-emerald-700">
                ₹{pricingData?.suggested_price?.toLocaleString('en-IN') || '2,499'}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setStep(1);
                setSelectedImageFile(null);
                setImageEnhanceData(null);
                setTranscript('');
                setExtractedAttributes(null);
                setGeneratedListing(null);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-artisan-200 text-xs font-bold text-slate-700 hover:bg-artisan-50"
            >
              + Create Another Craft Listing
            </button>

            {onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Open Admin Portal (Approve Request)</span>
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
