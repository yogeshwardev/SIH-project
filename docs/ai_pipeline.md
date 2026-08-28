# CraftLink AI — Image and Voice Pipeline

## Image transformation

The image endpoint validates type and size, writes a unique upload, segments the foreground, scores mask geometry/coherence/edges, refines the mask, performs conservative colour/lighting correction, and composites the product on a clean background. It returns both image URLs, the engine used, measured confidence components, and per-stage latency.

Fast-path acceptance is a threshold for avoiding a slower second model, not a hardcoded displayed score. If segmentation quality is weak, the service falls back to the more accurate path. The original is always retained for manual comparison.

## Voice interaction

The browser starts immediate speech recognition captions where supported while recording the real microphone stream. Recorded audio is sent to the backend. Local Faster Whisper uses a fast model first and runs the accuracy model only when probability-based checks fail; a configured cloud provider is optional.

Question audio uses neural TTS with caching when available, with browser speech synthesis as a fallback. The interface separately exposes a replay button and automatically speaks the next question after a user gesture has unlocked audio.

## Guided interview

The interview is stateless on the server: each request contains prior confirmed attributes and costs. Only one friendly question is shown at a time. The flow supports Hindi, Telugu, and English and retains Previous/Next navigation. Missing values stay missing; visual guesses cannot silently answer seller questions.

Required facts are seller description, material, production time, and the three unit-cost inputs. A final seller confirmation is stored independently from transcription/model confidence. Listing copy is generated only after the required evidence is present.

## Confidence semantics

- Image score: mask-quality measurements.
- Transcription score: decoder word/language probabilities.
- Interview readiness: percentage of required questions completed.
- Human confirmation: explicit boolean.
- Pricing score: cost-input completeness plus count of real persisted comparables.

None of these is a universal product-quality or business-accuracy guarantee.
