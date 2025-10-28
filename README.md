# LinkPlus (Angular + Firebase)

Admin-only Angular 20 app to manage educational topics and images with multilingual titles. Firebase is used for Auth (email/password), Firestore, and Storage.

## 1) Install dependencies

```bash
npm install
```

## 2) Add Firebase configuration

Create the following files and replace placeholders with your Firebase Web App config values from the Firebase console (Project settings → General → Your apps → Web app → SDK setup and configuration):

- `src/environments/environment.development.ts` (used for `ng serve` / development)
- `src/environments/environment.ts` (used for production builds)


## Environment configuration (keep secrets out of Git)

This project uses template-based environment files. Real Firebase keys and `adminEmail` are not committed.

Files in `src/environments/`:

- `environment.template.ts` – production template with placeholder tokens
- `environment.development.template.ts` – development template with placeholder tokens
- `environment.ts` and `environment.development.ts` – generated at build/serve time, ignored by Git

Placeholders are of the form `__FIREBASE_API_KEY__`, `__ADMIN_EMAIL__`, etc.

### Quick setup

Option A – generate from env vars (recommended):

1. Export required environment variables in your shell (or your CI):
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `ADMIN_EMAIL`
2. Run:
   - `npm run env:setup`

Option B – copy templates and fill in values manually:

1. Copy the templates to the real filenames:
   - `cp src/environments/environment.template.ts src/environments/environment.ts`
   - `cp src/environments/environment.development.template.ts src/environments/environment.development.ts`
2. Edit the files to replace placeholders with your real values.

The `start` and `build` scripts will automatically generate the environment files if missing by running the generator with `--if-missing`.
Example structure (replace the placeholder strings):

```ts
export const environment = {
  production: false, // true in environment.ts
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
  // The single admin account that can access the app
  adminEmail: 'admin@example.com',
} as const;
```

The app reads these values in `src/app/app.config.ts` during Firebase initialization.

### 2.1 Enable Auth and create the admin user

- In Firebase Console → Build → Authentication → Sign-in method, enable Email/Password
- In Users, create the admin user with the email you plan to use
- Make sure `adminEmail` in your environment files and in the rules files matches this email

## 3) Development server

To start a local development server, run:

```bash
npm start
```

Then open your browser at `http://localhost:4200/`. The application will automatically reload when you modify source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## 4) Build

To build the project run:

```bash
npm run build
```

Build artifacts are stored in the `dist/` directory. Production builds are optimized for performance and speed.

## 5) Firebase Hosting and Deploy

Before deploying, set your Firebase project ID in `.firebaserc`:

- Open `.firebaserc` and replace `YOUR_FIREBASE_PROJECT_ID` with your actual project ID
  (from Firebase Console → Project settings → General → Project ID).

Authenticate and verify the active account:

```bash
npm run firebase:login
npm run firebase:whoami
```

Deploy to Firebase Hosting (builds the app first):

```bash
npm run deploy
```

Optional: Create a temporary preview URL (great for reviews):

```bash
npm run deploy:preview
```

### Firestore and Storage security rules (admin-only)

This app is intended for a single admin user. The repository includes:

- `firestore.rules` – restricts all reads/writes to the admin email
- `storage.rules` – restricts uploads/deletes to the admin email and images up to 10MB (`jpeg|png|webp`)

Update the admin email in both rules files to match your real admin account:

```text
// In firestore.rules and storage.rules
// Replace admin@example.com with your admin email
```

To deploy rules along with hosting, you can run:

```bash
npm run deploy:all
```

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

- Angular CLI docs: https://angular.dev/tools/cli
- AngularFire docs: https://github.com/angular/angularfire
