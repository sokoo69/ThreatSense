import lexiconData from '../data/lexicon.bn.json';
import { EmotionType, LexiconEntry } from '../engine/types';
import { WordThreat } from './types';

export const LEXICON = lexiconData as LexiconEntry[];

const TRANSLATIONS: Record<string, string> = {
  বোমা: 'Bomb',
  বিস্ফোরক: 'Explosive',
  ধামাকা: 'Blast',
  উড়িয়ে: 'Blow up',
  খুন: 'Kill',
  মারব: 'Will strike',
  মার্ডার: 'Murder',
  জবাই: 'Slaughter',
  শেষ: 'Finish off',
  খতম: 'Eliminate',
  গুলি: 'Shoot',
  অস্ত্র: 'Weapon',
  বন্দুক: 'Gun',
  ছুরি: 'Knife',
  হামলা: 'Assault',
  আক্রমণ: 'Attack',
  আঘাত: 'Strike',
  আগুন: 'Fire',
  ধ্বংস: 'Destroy',
  নাশকতা: 'Sabotage',
  জিম্মি: 'Hostage',
  বিষ: 'Poison',
  রক্ত: 'Blood',
  আতঙ্ক: 'Terror',
  ফাঁদ: 'Trap',
  বিপদ: 'Danger',
  আসুন: 'Welcome',
};

/** Harmless words have no lexicon entry, so their spelling lives here. */
const BENIGN_ROMANIZED: Record<string, string> = {
  আসুন: 'asun',
};

export const EMOTION_LABELS: Record<EmotionType, string> = {
  angry: 'Anger',
  disgust: 'Disgust',
  fear: 'Fear',
  happy: 'Happiness',
  neutral: 'Neutral',
  sad: 'Sadness',
  surprise: 'Surprise',
};

export function lookupWord(word: string): {
  romanized: string | null;
  translation: string | null;
  threat: WordThreat;
} {
  const clean = word.trim();
  const entry = LEXICON.find((item) => item.word === clean);
  const weight = entry?.weight ?? 0;

  return {
    romanized: entry?.romanized ?? BENIGN_ROMANIZED[clean] ?? null,
    translation: TRANSLATIONS[clean] ?? null,
    threat: weight >= 0.7 ? 'High' : weight >= 0.4 ? 'Medium' : 'Low',
  };
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
