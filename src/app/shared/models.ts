import type { Timestamp } from 'firebase/firestore';

export type LanguageCode =
  | 'en'
  | 'ar'
  | 'am'
  | 'bn'
  | 'zh-CN'
  | 'zh-TW'
  | 'cs'
  | 'prs'
  | 'fa'
  | 'hi'
  | 'ps'
  | 'pt'
  | 'pa'
  | 'ru'
  | 'so'
  | 'es'
  | 'tl'
  | 'ta'
  | 'ti'
  | 'tr'
  | 'uk'
  | 'ur'
  | 'vi';

export type LocalizedTitles = Record<LanguageCode, string>;

export const SUPPORTED_LANGUAGES: LanguageCode[] = [
  'en',
  'ar',
  'am',
  'bn',
  'zh-CN',
  'zh-TW',
  'cs',
  'prs',
  'fa',
  'hi',
  'ps',
  'pt',
  'pa',
  'ru',
  'so',
  'es',
  'tl',
  'ta',
  'ti',
  'tr',
  'uk',
  'ur',
  'vi',
];

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  ar: 'Arabic',
  am: 'Amharic',
  bn: 'Bengali - Bangla',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  cs: 'Czech',
  prs: 'Dari',
  fa: 'Farsi',
  hi: 'Hindi',
  ps: 'Pashto',
  pt: 'Portuguese',
  pa: 'Punjabi',
  ru: 'Russian',
  so: 'Somali',
  es: 'Spanish',
  tl: 'Tagalog',
  ta: 'Tamil',
  ti: 'Tigrinya',
  tr: 'Turkish',
  uk: 'Ukrainian',
  ur: 'Urdu',
  vi: 'Vietnamese',
};

export const RTL_LANGUAGES: ReadonlySet<LanguageCode> = new Set<LanguageCode>([
  'ar',
  'fa',
  'ps',
  'prs',
  'ur',
]);

export function emptyLocalizedTitles(): LocalizedTitles {
  return Object.fromEntries(SUPPORTED_LANGUAGES.map((l) => [l, ''])) as LocalizedTitles;
}

export interface ImageMeta {
  id: string;
  path: string; // Storage path, e.g., topics/{topicId}/images/{imageId}.ext
  url: string; // Public download URL
  titles: LocalizedTitles;
  mime?: string;
  width?: number;
  height?: number;
  size?: number; // bytes
  createdAt?: Timestamp;
}

export interface Topic {
  id: string;
  gradeId: string;
  order: number;
  name: LocalizedTitles;
  description: LocalizedTitles;
  images: ImageMeta[];
  active?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Grade {
  id: string;
  name: string;
}

export const GRADES: Grade[] = [
  { id: 'jk-sk', name: 'JK/SK' },
  { id: 'grade-1-science', name: 'Grade 1 Science' },
  { id: 'grade-1-social-studies', name: 'Grade 1 Social Studies' },
  { id: 'grade-2-science', name: 'Grade 2 Science' },
  { id: 'grade-2-social-science', name: 'Grade 2 Social Science' },
  { id: 'grade-3-science', name: 'Grade 3 Science' },
  { id: 'grade-3-social-science', name: 'Grade 3 Social Science' },
];

export interface GradeSettings {
  id: string;
  hardCoverPrintOut: LocalizedTitles;
  homeLanguagePrintOut: LocalizedTitles;
  updatedAt?: Timestamp;
}
