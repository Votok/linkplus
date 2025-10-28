import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData } from '@angular/fire/firestore';
import {
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { Topic, ImageMeta, LocalizedTitles } from '../shared/models';
import { Storage } from '@angular/fire/storage';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

const TOPICS_COLLECTION = 'topics';
const MAX_IMAGES = 10;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function getExtFromFile(file: File): string {
  const nameExt = file.name.includes('.') ? file.name.split('.').pop() : '';
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return (nameExt || 'bin').toLowerCase();
}

function newId(): string {
  // Prefer crypto.randomUUID when available
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return (crypto as Crypto & { randomUUID: () => string }).randomUUID();
    }
  } catch {
    // ignore
  }
  return Math.random().toString(36).slice(2);
}

@Injectable({ providedIn: 'root' })
export class TopicsService {
  private readonly db = inject(Firestore);
  private readonly storage = inject(Storage);

  list$(): Observable<Topic[]> {
    const col = collection(this.db, TOPICS_COLLECTION);
    return collectionData(col, { idField: 'id' }) as Observable<Topic[]>;
  }

  get$(id: string): Observable<Topic | undefined> {
    const ref = doc(this.db, TOPICS_COLLECTION, id);
    return docData(ref, { idField: 'id' }) as Observable<Topic | undefined>;
  }

  async create(data: { name: string; description: string }): Promise<string> {
    const id = newId();
    const ref = doc(this.db, TOPICS_COLLECTION, id);
    const now = serverTimestamp();
    await setDoc(ref, {
      id,
      name: data.name,
      description: data.description ?? '',
      images: [],
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  }

  async update(id: string, patch: Partial<Omit<Topic, 'id' | 'createdAt'>>): Promise<void> {
    const refDoc = doc(this.db, TOPICS_COLLECTION, id);
    await setDoc(refDoc, { ...patch, updatedAt: serverTimestamp() }, { merge: true });
  }

  async remove(id: string): Promise<void> {
    // Best-effort: try to delete associated images from Storage first
    const ref = doc(this.db, TOPICS_COLLECTION, id);
    const snap = await getDoc(ref);
    const topic = snap.data() as Topic | undefined;
    if (topic?.images?.length) {
      await Promise.allSettled(
        topic.images.map((img) => {
          const sref = refFromPath(this.storage, img.path);
          return deleteObject(sref);
        })
      );
    }
    await deleteDoc(ref);
  }

  async uploadImage(topicId: string, file: File, titles: LocalizedTitles): Promise<ImageMeta> {
    if (!ALLOWED_MIME.includes(file.type)) {
      throw new Error('Unsupported file type');
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('File too large');
    }

    // Generate Storage path deterministically for this upload attempt
    const imageId = newId();
    const ext = getExtFromFile(file);
    const path = `${TOPICS_COLLECTION}/${topicId}/images/${imageId}.${ext}`;

    // 1) Upload to Storage OUTSIDE of any Firestore transaction.
    const sref = ref(this.storage, path);
    const task = uploadBytesResumable(sref, file, { contentType: file.type });
    await new Promise<void>((resolve, reject) => {
      task.on(
        'state_changed',
        undefined,
        (e) => reject(e),
        () => resolve()
      );
    });
    const url = await getDownloadURL(sref);

    // 2) Append metadata in a minimal Firestore transaction that enforces limits.
    const topicRef = doc(this.db, TOPICS_COLLECTION, topicId);
    const meta: Omit<ImageMeta, 'createdAt'> = {
      id: imageId,
      path,
      url,
      titles,
      mime: file.type,
      size: file.size,
    };

    // Important: We do NOT delete blobs on Firestore failure by policy.
    const committedMeta = await runTransaction(this.db, async (trx) => {
      const snap = await trx.get(topicRef);
      if (!snap.exists()) throw new Error('Topic not found');
      const data = snap.data() as Topic;
      const current = Array.isArray(data.images) ? data.images.slice() : [];
      if (current.length >= MAX_IMAGES) throw new Error('Image limit reached');
      current.push(meta);
      await trx.update(topicRef, { images: current, updatedAt: serverTimestamp() });
      return meta;
    });

    return committedMeta;
  }

  async deleteImage(topicId: string, imageId: string): Promise<void> {
    const topicRef = doc(this.db, TOPICS_COLLECTION, topicId);
    const snap = await getDoc(topicRef);
    if (!snap.exists()) return;
    const data = snap.data() as Topic;
    const next = (data.images || []).filter((img) => img.id !== imageId);
    const removed = (data.images || []).find((img) => img.id === imageId);
    await updateDoc(topicRef, { images: next, updatedAt: serverTimestamp() });
    if (removed?.path) {
      const sref = refFromPath(this.storage, removed.path);
      await deleteObject(sref).catch(() => void 0);
    }
  }
}

function refFromPath(storage: Storage, path: string) {
  return ref(storage, path);
}
