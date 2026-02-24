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
  { id: 'junior-kinder', name: 'Junior Kinder' },
  { id: 'senior-kinder', name: 'Senior Kinder' },
  { id: 'grade-1', name: 'Grade 1' },
  { id: 'grade-2', name: 'Grade 2' },
  { id: 'grade-3', name: 'Grade 3' },
];
