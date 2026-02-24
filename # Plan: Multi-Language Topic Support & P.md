# Plan: Multi-Language Topic Support & Print Redesign

## TL;DR

Extend `Topic.name` and `Topic.description` from plain strings to `LocalizedTitles` (per-language objects like image titles already use). Move the language selector to the top of the editor so it controls **all** fields (name, description, image titles). When a non-EN language is selected, show EN translations as hint tooltips above each input. Remove the dedicated EN image-title input from image cards — each card shows only a single title input for the selected language. Update the print component to produce a **two-page** layout: page 1 = topic name + rendered Markdown description, page 2 = topic title + image grid (unchanged from today). Always show EN name in the topics list. No automated migration — existing docs will be manually updated.

---

## Phase 1 — Data Model & Service Layer

### 1.1 Extend `Topic` model

**File:** `src/app/shared/models.ts`

- Change `Topic.name` from `string` to `LocalizedTitles`
- Change `Topic.description` from `string` to `LocalizedTitles`
- (Optional) Add a type alias `LocalizedText = LocalizedTitles` for semantic clarity, or simply reuse `LocalizedTitles`

### 1.2 Update `TopicsService`

**File:** `src/app/services/topics.service.ts`

- **`create()`** — Change `data` parameter from `{ name: string; description: string }` to `{ name: LocalizedTitles; description: LocalizedTitles }`. Store `name` and `description` as objects. Keep the `.trim()` logic but apply it to all language values: e.g. `Object.fromEntries(Object.entries(data.name).map(([k, v]) => [k, v.trim()]))`
- **`update()`** — The existing `patch.name?.trim()` logic needs to handle `LocalizedTitles` (object): iterate and trim each value when `patch.name` is an object
- **`extractIndex()`** — Change to accept `LocalizedTitles | string` and always extract from the EN value: `extractIndex(name)` → parse `typeof name === 'string' ? name : name.en`
- **`list$()`** — Sort uses `extractIndex(t.name)` — will work once `extractIndex` is updated

### 1.3 Verification

- TypeScript compiles without errors
- Existing tests (if any) updated to use `LocalizedTitles` for name/description

---

## Phase 2 — Topic Editor Restructure

### 2.1 Move language selector to top-level position

**File:** `src/app/topics/editor/topic-editor.component.ts`

- Move the `<mat-select>` for "Working language" from the images toolbar section up into the page header area (next to "Edit Topic" heading or just below the divider)
- Include **all** languages in the selector (add `'en'` back — currently excluded). Change `langs` to `SUPPORTED_LANGUAGES` instead of filtering out EN
- Update `selectedLang` signal type from `NonEnglishLanguage` to `LanguageCode`, default to `'en'`
- The selected language now controls which language's `name`, `description`, AND image titles are shown/edited

### 2.2 Restructure the form for localized name & description

- Change form controls:
  - `name` → bound to `topic.name[selectedLang()]`
  - `description` → bound to `topic.description[selectedLang()]`
- When the selected language changes, patch the form with values from `topic.name[lang]` and `topic.description[lang]`
- **EN hint tooltips**: When `selectedLang() !== 'en'`, render a small hint/tooltip element above the `name` input and above the `description` textarea showing the EN value. Style as a subtle, read-only hint (e.g. light background, smaller font, prefixed with "EN:"). Use a `<div class="en-hint">` that is conditionally shown
- The Markdown preview should render the **currently selected language's** description

### 2.3 Update save logic

- `onSave()` should read the current form values and merge them into the existing `LocalizedTitles` object for the selected language only, preserving other languages:

const current = this.topic();
const lang = this.selectedLang();
const updatedName = { ...current.name, [lang]: formValue.name };
const updatedDesc = { ...current.description, [lang]: formValue.description };
await this.topics.update(id, { name: updatedName, description: updatedDesc });

### 2.4 Simplify image title editing

- Each image card: remove the always-visible EN title `<mat-form-field>`. Keep only **one** title input per card, bound to `img.titles[selectedLang()]`
- When `selectedLang() !== 'en'`, show an EN hint tooltip above the image title input (same pattern as name/description hints), displaying `img.titles.en`
- When `selectedLang() === 'en'`, no hint is shown (user is editing EN directly)

### 2.5 Verification

- Switch languages in editor → form fields update to show the correct language's values
- EN hints appear above fields when a non-EN language is selected
- Save correctly persists only the selected language's values without overwriting others
- Image cards show a single title input per the selected language

---

## Phase 3 — Topics List Update

### 3.1 Display EN name

**File:** `src/app/topics/list/topics-list.component.ts`

- Change `t.name` references to `t.name.en` (or `t.name?.en` for safety during manual migration period)
- This is a minimal change — the list always shows EN

### 3.2 Verification

- Topics list renders correctly with EN names

---

## Phase 4 — Print Component Redesign

### 4.1 Language-aware topic name & description

**File:** `src/app/print/print.component.ts`

- Change `topic.name` to `topic.name[this.lang]` in the template
- Add a new `getDescription()` helper: `return topic.description[this.lang] || ''`

### 4.2 Two-page print layout

Restructure the template to have two distinct print sections:

**Page 1 — Cover page (new)**

- `<div class="print-page cover-page">`
- Contains: `<h1>{{ topic.name[lang] }}</h1>` (centered, large)
- Contains: rendered Markdown of `topic.description[lang]` using `<markdown [data]="getDescription()"></markdown>`
- Styled to fill exactly one A4 page

**Page 2 — Images page (existing, mostly unchanged)**

- `<div class="print-page images-page">`
- Contains: `<h2>{{ topic.name[lang] }}</h2>` as a smaller title at the top
- Contains: the existing 2×4 image grid with captions
- Keep all existing print CSS for the images grid

### 4.3 Print CSS changes

- **Cover page**: `page-break-after: always` to force page 2 onto a new sheet. Center content vertically and horizontally. Title large (`font-size: 24pt` or similar). Description below in normal reading size
- **Images page**: Keep existing grid CSS. Re-enable the title (currently hidden via `.print-page .title { display: none }`) but as a smaller heading. Adjust `grid-auto-rows` if needed to account for the title taking space
- Both pages: maintain `@page { size: A4; margin: 10mm; }`

### 4.4 Screen preview

- On screen (non-print), show both sections stacked with visual separation (e.g. a gap or subtle divider between the two "pages") so the user can preview what will print
- The cover page preview should also render Markdown

### 4.5 Verification

- Print preview (Cmd+P) shows 2 pages: cover page with name + Markdown description, then images page
- Language selector changes both pages' content
- Screen preview shows both sections

---

## Phase 5 — Final Polish & Testing

### 5.1 End-to-end workflow test

1. Open editor → language defaults to EN → fill name, description, image titles in EN → Save
2. Switch to CS → EN hints appear above all fields → fill CS translations → Save
3. Switch to ES → EN hints appear, CS values are preserved → fill ES → Save
4. Open print → select CS → cover page shows CS name/description, images show CS captions
5. Print → verify 2-page output

### 5.2 Edge cases

- Empty translations: if a language has no translation, print should fall back gracefully (show empty or fall back to EN — decide during implementation, suggest showing empty)
- `extractIndex` still works correctly with `LocalizedTitles` object
- Topic creation flow (if there's a create dialog/form in the list) works with the new `LocalizedTitles` structure

### 5.3 Files changed (summary)

| File                                              | Changes                                                                       |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/app/shared/models.ts`                        | `Topic.name` and `Topic.description` → `LocalizedTitles`                      |
| `src/app/services/topics.service.ts`              | Update create/update signatures, trim logic, `extractIndex`                   |
| `src/app/topics/editor/topic-editor.component.ts` | Move lang selector to top, localized form, EN hints, single image title input |
| `src/app/topics/list/topics-list.component.ts`    | `t.name` → `t.name.en`                                                        |
| `src/app/print/print.component.ts`                | Localized name/desc, two-page layout with Markdown cover page                 |

---

## Decisions

- **EN is not enforced as required** — it's the user's workflow to fill EN first, but no validation enforces it
- **No migration script** — existing Firestore docs will be manually updated to use `LocalizedTitles` objects
- **Topics list always shows EN** — no language selector in the list view
- **Print description uses rendered Markdown** — consistent with editor preview
- **Single image title input per card** — driven by the global language selector, with EN hint tooltip for non-EN languages
