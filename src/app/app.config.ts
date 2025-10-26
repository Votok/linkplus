import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';

import { environment } from '../environments/environment';
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => {
      const auth = getAuth();
      interface Emulator {
        host: string;
        port: number;
      }
      interface DevEnv {
        useEmulators?: boolean;
        emulators?: { auth?: Emulator; firestore?: Emulator; storage?: Emulator };
      }
      const dev = environment as unknown as DevEnv;
      try {
        const a = dev.emulators?.auth;
        if (!environment.production && dev.useEmulators && a) {
          connectAuthEmulator(auth, `http://${a.host}:${a.port}`, { disableWarnings: true });
          console.info('[Firebase] Auth emulator connected');
        }
      } catch (e) {
        console.warn('[Firebase] Auth emulator connect failed:', e);
      }
      return auth;
    }),
    provideFirestore(() => {
      const db = getFirestore();
      interface Emulator {
        host: string;
        port: number;
      }
      interface DevEnv {
        useEmulators?: boolean;
        emulators?: { auth?: Emulator; firestore?: Emulator; storage?: Emulator };
      }
      const dev = environment as unknown as DevEnv;
      try {
        const f = dev.emulators?.firestore;
        if (!environment.production && dev.useEmulators && f) {
          connectFirestoreEmulator(db, f.host, f.port);
          console.info('[Firebase] Firestore emulator connected');
        }
      } catch (e) {
        console.warn('[Firebase] Firestore emulator connect failed:', e);
      }
      return db;
    }),
    provideStorage(() => {
      const storage = getStorage();
      interface Emulator {
        host: string;
        port: number;
      }
      interface DevEnv {
        useEmulators?: boolean;
        emulators?: { auth?: Emulator; firestore?: Emulator; storage?: Emulator };
      }
      const dev = environment as unknown as DevEnv;
      try {
        const s = dev.emulators?.storage;
        if (!environment.production && dev.useEmulators && s) {
          connectStorageEmulator(storage, s.host, s.port);
          console.info('[Firebase] Storage emulator connected');
        }
      } catch (e) {
        console.warn('[Firebase] Storage emulator connect failed:', e);
      }
      return storage;
    }),
  ],
};
