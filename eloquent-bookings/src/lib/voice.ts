// Names that signal a female voice across the common platforms (iOS/macOS,
// Windows/Edge, Android/Chrome). Used to pick a female voice for the assistant.
const FEMALE_HINTS =
  /(female|woman|samantha|victoria|karen|tessa|susan|catherine|serena|moira|fiona|amelia|sonia|aria|jenny|libby|sara|zira|hazel|google uk english female)/i;

/**
 * Choose a female English voice from the browser's available voices. Prefers an
 * English voice whose name signals female; otherwise any "female"-labelled
 * voice; otherwise the first English voice; otherwise the first voice at all.
 */
export function pickFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  const pool = english.length ? english : voices;
  return (
    pool.find((v) => FEMALE_HINTS.test(v.name)) ??
    pool.find((v) => /female/i.test(v.name)) ??
    pool[0]
  );
}
