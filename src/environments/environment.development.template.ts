// Development environment configuration (template)
// Replace placeholder tokens with real values via tools/generate-env.js or by manual copy.
export const environment = {
  production: false,
  firebase: {
    apiKey: '__FIREBASE_API_KEY__',
    authDomain: '__FIREBASE_AUTH_DOMAIN__',
    projectId: '__FIREBASE_PROJECT_ID__',
    storageBucket: '__FIREBASE_STORAGE_BUCKET__',
    messagingSenderId: '__FIREBASE_MESSAGING_SENDER_ID__',
    appId: '__FIREBASE_APP_ID__',
  },
  // Email of the admin user allowed to access the app
  adminEmail: '__ADMIN_EMAIL__',
} as const;
