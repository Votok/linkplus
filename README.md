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
		appId: 'YOUR_APP_ID'
	},
	// The single admin account that can access the app
	adminEmail: 'admin@example.com',
	// Optional: use Firebase emulators locally
	useEmulators: false,
	emulators: {
		auth: { host: 'localhost', port: 9099 },
		firestore: { host: 'localhost', port: 8080 },
		storage: { host: 'localhost', port: 9199 }
	}
} as const;
```

The app reads these values in `src/app/app.config.ts` during Firebase initialization.

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
