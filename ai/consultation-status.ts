export type GuidedReason =
  | 'introduction'
  | 'safety'
  | 'not_configured'
  | 'unavailable';
export function consultationStatus(mode: string, reason?: GuidedReason) {
  if (mode === 'ai')
    return 'AI response · citations checked against retrieved evidence.';
  if (reason === 'introduction')
    return 'ConsultAI introduction · prepared product guidance.';
  if (reason === 'safety')
    return 'Guided safety response · no admission or visa guarantees.';
  if (reason === 'not_configured')
    return 'Guided response · live AI is not configured for this environment.';
  return 'Guided fallback · live AI could not provide a validated answer this time. You can retry.';
}
export function isIntroduction(message: string) {
  return /^(?:tell me about yourself|who are you|what are you|what is consultai|what can you do|how can you help(?: me)?|introduce yourself|hi|hello|hey)[.!?\s]*$/i.test(
    message.trim(),
  );
}
