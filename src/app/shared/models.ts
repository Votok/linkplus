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
  name: string;
  description: string; // Markdown or plain text
  images: ImageMeta[];
  active?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const SUPPORTED_LANGUAGES: LanguageCode[] = ['en', 'cs', 'es'];
