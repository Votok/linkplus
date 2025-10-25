import {
  ApplicationConfig,
  APP_INITIALIZER,
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
import { connectAuthEmulator, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => () => {
        interface Emulator {
          host: string;
          port: number;
        }
        interface DevEnv {
          useEmulators?: boolean;
          emulators?: { auth?: Emulator; firestore?: Emulator; storage?: Emulator };
        }
        const dev = environment as unknown as DevEnv;
        if (!environment.production && dev.useEmulators) {
          const auth: Auth = getAuth();
          const db: Firestore = getFirestore();
          const storage: FirebaseStorage = getStorage();

          try {
            const { auth: a, firestore: f, storage: s } = dev.emulators || {};
            if (a && f && s) {
              connectAuthEmulator(auth, `http://${a.host}:${a.port}`, { disableWarnings: true });
              connectFirestoreEmulator(db, f.host, f.port);
              connectStorageEmulator(storage, s.host, s.port);
              console.info('[Firebase] Connected to local emulators');
            }
          } catch (e) {
            console.warn('[Firebase] Emulator connection skipped or failed:', e);
          }
        }
      },
    },
  ],
};
