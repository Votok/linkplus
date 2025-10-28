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

This project keeps real secrets only in untracked local files. Templates provide structure; you copy them once and fill in values locally.

Files in `src/environments/`:

- `environment.template.ts` – production template with placeholder tokens
- `environment.development.template.ts` – development template with placeholder tokens
- `environment.ts` and `environment.development.ts` – your local copies (ignored by Git)

Placeholders are of the form `__FIREBASE_API_KEY__`, `__ADMIN_EMAIL__`, etc.

### Quick setup (local dev)

1. Generate local files from templates (copy-only, no env vars needed):

- `npm run env:setup`
- or simply run `npm start`/`npm run build` once; they auto-create missing env files via copy-only

2. Open the generated files and replace placeholders with your real values:

- `src/environments/environment.development.ts`
- `src/environments/environment.ts`

These files are `.gitignore`d and won’t be committed.

### CI/CD

For CI, you have two options:

- Secure file provisioning (preferred): write `src/environments/environment.ts` (and dev variant if needed) from a secure store at job runtime.
- Or use the generator with CI env vars: `npm run env:ci` (reads values from CI env and writes the files) before `npm run build`.

The `start` and `build` scripts run the generator with `--if-missing --copy-only`, so they will not overwrite your local files once created.
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

### Dev vs Prod builds and deploys

- Development builds use Angular's `development` configuration and the file replacement that loads `src/environments/environment.development.ts`.
- Production builds use the default `production` configuration and `src/environments/environment.ts`.

Quick commands:

```bash
# Deploy to Development (builds with development config, uses environment.development.ts)
npm run deploy:dev

# Deploy to Production (builds with production config, uses environment.ts)
# Uses your default project from .firebaserc or "firebase use"
npm run deploy

# Or explicitly set the prod project on the command
npm run deploy:prod --project=YOUR_PROD_PROJECT_ID
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
