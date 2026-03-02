import type { Timestamp } from 'firebase/firestore';

export type LanguageCode = 'en' | 'cs' | 'es';

export interface LocalizedTitles {
  en: string;
  cs: string;
  es: string;
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

export const SUPPORTED_LANGUAGES: LanguageCode[] = ['en', 'cs', 'es'];

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
  hardCoverPrintOut: string;
  homeLanguagePrintOut: string;
  updatedAt?: Timestamp;
}
