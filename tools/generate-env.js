#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_DIR = path.join(ROOT, 'src', 'environments');

const args = new Set(process.argv.slice(2));
const ifMissingOnly = args.has('--if-missing');
const copyOnly = args.has('--copy-only');

/**
 * Replace placeholder tokens in content with values from process.env.
 * Any missing env value leaves the placeholder intact and logs a warning.
 */
function replacePlaceholders(content) {
  const mapping = {
    '__FIREBASE_API_KEY__': process.env.FIREBASE_API_KEY,
    '__FIREBASE_AUTH_DOMAIN__': process.env.FIREBASE_AUTH_DOMAIN,
    '__FIREBASE_PROJECT_ID__': process.env.FIREBASE_PROJECT_ID,
    '__FIREBASE_STORAGE_BUCKET__': process.env.FIREBASE_STORAGE_BUCKET,
    '__FIREBASE_MESSAGING_SENDER_ID__': process.env.FIREBASE_MESSAGING_SENDER_ID,
    '__FIREBASE_APP_ID__': process.env.FIREBASE_APP_ID,
    '__ADMIN_EMAIL__': process.env.ADMIN_EMAIL,
  };

  for (const [token, value] of Object.entries(mapping)) {
    if (typeof value === 'string' && value.length > 0) {
      // Replace all occurrences of the token
      content = content.split(token).join(value);
    } else if (content.includes(token)) {
      console.warn(`[generate-env] Warning: Missing env for ${token}. Leaving placeholder as-is.`);
    }
  }
  return content;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function generateFromTemplate(templateBasename, destBasename) {
  const templatePath = path.join(ENV_DIR, templateBasename);
  const destPath = path.join(ENV_DIR, destBasename);

  if (ifMissingOnly && fs.existsSync(destPath)) {
    return { skipped: true, destPath };
  }

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${path.relative(ROOT, templatePath)}`);
  }

  const template = fs.readFileSync(templatePath, 'utf8');
  const output = copyOnly ? template : replacePlaceholders(template);

  ensureDir(path.dirname(destPath));
  fs.writeFileSync(destPath, output, 'utf8');
  return { skipped: false, destPath };
}

function run() {
  try {
    const results = [
      generateFromTemplate('environment.template.ts', 'environment.ts'),
      generateFromTemplate('environment.development.template.ts', 'environment.development.ts'),
    ];

    for (const r of results) {
      const rel = path.relative(ROOT, r.destPath);
      if (r.skipped) {
        console.log(`[generate-env] Skipped (exists): ${rel}`);
      } else {
        console.log(`[generate-env] Wrote: ${rel}${copyOnly ? ' (copy-only)' : ''}`);
      }
    }
  } catch (err) {
    console.error('[generate-env] Error:', err.message || err);
    process.exitCode = 1;
  }
}

run();
