import {
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MATERIAL_IMPORTS } from '../../shared/material.imports';
import { TopicsService } from '../../services/topics.service';
import {
  ImageMeta,
  LocalizedTitles,
  Topic,
  LanguageCode,
  SUPPORTED_LANGUAGES,
  GRADES,
} from '../../shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, map, switchMap, tap, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MarkdownModule, MarkdownComponent } from 'ngx-markdown';
import { CdkDragDrop, CdkDragStart, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { LoadingService } from '../../services/loading.service';
import { HasUnsavedChanges } from '../../auth/unsaved-changes.guard';

const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  cs: 'Čeština',
  es: 'Español',
};
@Component({
  standalone: true,
  selector: 'app-topic-editor',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MarkdownModule,
    MarkdownComponent,
    DragDropModule,
    ...MATERIAL_IMPORTS,
  ],
  template: `
    @if (topic(); as t) {
      <div class="page">
        <div class="container">
          <div class="header">
            <h2>Edit Topic</h2>
            <span class="topic-id">#{{ t.id }}</span>
            <mat-chip>{{ gradeName() }}</mat-chip>
            <span class="spacer"></span>
            <a
              mat-stroked-button
              color="primary"
              [routerLink]="['/topics']"
              [queryParams]="{ grade: topic()?.gradeId }"
            >
              <mat-icon>arrow_back</mat-icon>
              Back to list
            </a>
          </div>
          <mat-divider />

          <div class="lang-selector">
            <mat-form-field appearance="outline">
              <mat-label>Working language</mat-label>
              <mat-select [value]="selectedLang()" (valueChange)="selectedLang.set($event)">
                @for (l of langs; track l) {
                  <mat-option [value]="l"
                    >{{ languageLabel(l) }} ({{ l.toUpperCase() }})</mat-option
                  >
                }
              </mat-select>
            </mat-form-field>
          </div>

          <form [formGroup]="form" class="form" (ngSubmit)="onSave()">
            <div class="name-row">
              <mat-form-field appearance="outline" class="order-field">
                <mat-label>Order</mat-label>
                <input matInput type="number" formControlName="order" />
              </mat-form-field>
              <div class="field-with-hint" style="flex:1">
                <mat-form-field appearance="outline">
                  <mat-label>Topic name</mat-label>
                  <input matInput formControlName="name" />
                  <mat-error *ngIf="form.controls.name.invalid">Name is required</mat-error>
                </mat-form-field>
                @if (selectedLang() !== 'en' && topic()?.name?.en) {
                  <span class="en-badge" [matTooltip]="topic()!.name.en" matTooltipPosition="above"
                    >EN</span
                  >
                }
              </div>
            </div>

            <div class="field-with-hint">
              <mat-form-field appearance="outline" class="full">
                <mat-label>Description (Markdown)</mat-label>
                <textarea matInput formControlName="description" rows="8"></textarea>
              </mat-form-field>
              @if (selectedLang() !== 'en' && topic()?.description?.en) {
                <span
                  class="en-badge"
                  [matTooltip]="topic()!.description.en"
                  matTooltipPosition="above"
                  >EN</span
                >
              }
            </div>

            <div class="preview">
              <h3>Markdown preview</h3>
              <markdown [data]="form.controls.description.value || ''"></markdown>
            </div>

            <div class="actions">
              <button mat-flat-button color="primary" [disabled]="form.invalid || saving">
                Save
              </button>
            </div>
          </form>

          <mat-divider />

          <!-- Images toolbar moved back into the narrow container -->
          <section class="images-controls">
            <div class="images-toolbar">
              <h3>Images</h3>
              <span class="spacer"></span>
              <button
                mat-flat-button
                color="primary"
                (click)="fileInput.click()"
                [disabled]="uploading || t.images.length >= 10"
              >
                <mat-icon>upload</mat-icon>
                Upload Image
              </button>
              <input
                #fileInput
                type="file"
                accept="image/jpeg,image/png,image/webp"
                (change)="onFileSelected($event)"
                class="file-input"
              />
            </div>
          </section>
          <mat-divider />
        </div>

        <section class="images">
          <div
            class="grid"
            cdkDropList
            [cdkDropListData]="t.images"
            [cdkDropListDisabled]="uploading || deleting || saving || reordering"
            cdkDropListOrientation="horizontal"
            (cdkDropListDropped)="dropImages($event)"
          >
            @for (img of t.images; track img.id) {
              <div
                class="card"
                cdkDrag
                (cdkDragStarted)="onDragStart($event)"
                (cdkDragEnded)="onDragEnd()"
              >
                <img [src]="img.url" [alt]="img.titles.en || 'image'" />
                <div class="img-fields">
                  <div class="field-with-hint">
                    <mat-form-field appearance="outline">
                      <mat-label>Title ({{ selectedLang().toUpperCase() }})</mat-label>
                      <input
                        matInput
                        [value]="img.titles[selectedLang()] || ''"
                        (change)="onTitleChange(img, selectedLang(), $any($event.target).value)"
                      />
                    </mat-form-field>
                    @if (selectedLang() !== 'en' && img.titles.en) {
                      <span class="en-badge" [matTooltip]="img.titles.en" matTooltipPosition="above"
                        >EN</span
                      >
                    }
                  </div>
                  <div class="row-actions">
                    <button mat-stroked-button color="warn" (click)="deleteImage(img)">
                      <mat-icon>delete</mat-icon>
                      Remove
                    </button>
                  </div>
                </div>

                <ng-template cdkDragPlaceholder>
                  <div class="card placeholder">
                    <div class="ph-image"></div>
                    <div class="ph-fields"></div>
                  </div>
                </ng-template>

                <ng-template cdkDragPreview>
                  <div class="card preview" [style.width.px]="dragPreviewWidth">
                    <img [src]="img.url" [alt]="img.titles.en || 'image'" />
                  </div>
                </ng-template>
              </div>
            }
          </div>
        </section>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .page {
        height: 100%;
        overflow-y: auto; /* single vertical scroll container for the page */
        overflow-x: visible; /* allow full-bleed children */
      }
      .container {
        padding: 16px;
        display: grid;
        gap: 16px;
        max-width: 920px;
        margin: 0 auto;
      }
      .images-controls {
        margin-top: 16px;
      }
      .images-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .file-input {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .topic-id {
        opacity: 0.6;
      }
      .spacer {
        flex: 1 1 auto;
      }
      .form {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .name-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }
      .order-field {
        width: 90px;
        flex-shrink: 0;
      }
      .form .full {
        grid-column: 1 / -1;
      }
      .preview {
        border: 1px dashed rgba(0, 0, 0, 0.2);
        padding: 12px;
        border-radius: 8px;
        background: #fafafa;
      }
      .actions {
        display: flex;
        gap: 12px;
      }
      .lang-selector {
        margin-top: 8px;
      }
      .field-with-hint {
        position: relative;
      }
      .field-with-hint mat-form-field {
        width: 100%;
      }
      .en-badge {
        position: absolute;
        top: 8px;
        right: -12px;
        background: #1976d2;
        color: white;
        font-size: 10px;
        font-weight: 600;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: help;
        z-index: 1;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }
      .images {
        display: grid;
        gap: 12px;
        /* Full-bleed row: expand to viewport width while remaining inside the scrolling container */
        width: 100vw;
        margin-left: calc(50% - 50vw);
        margin-right: calc(50% - 50vw);
        padding-inline: 16px; /* match page gutter */
        padding-block: 12px; /* touch-friendly space above and below */
        box-sizing: border-box;
        overflow-x: auto; /* make the full-bleed section the horizontal scroller */
        overscroll-behavior-x: contain;
        -webkit-overflow-scrolling: touch;
      }
      .images .controls {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .grid {
        display: inline-flex; /* shrink-wrap to its content so parent handles scrolling */
        flex-wrap: nowrap; /* keep a single row */
        gap: 16px;
        align-items: stretch;
        min-width: max-content; /* let cards define the natural width */
        overflow: visible; /* parent (.images) owns scrolling */
        padding-block: 12px; /* extra space to reduce accidental drag */
        touch-action: pan-x; /* prefer horizontal panning over drag */
      }
      .card {
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 12px;
        overflow: hidden;
        background: white;
        display: grid;
        cursor: grab;
        /* Fixed item width in a single-row scroller */
        flex: 0 0 280px;
        width: 280px;
      }
      .card.preview {
        /* width controlled dynamically during drag */
      }
      .card.placeholder {
        border: 2px dashed var(--mdc-theme-primary, #3f51b5);
        background: rgba(63, 81, 181, 0.06);
      }
      .card.placeholder .ph-image {
        height: 180px;
      }
      .card.placeholder .ph-fields {
        height: 120px;
      }
      .cdk-drag-dragging {
        cursor: grabbing;
      }
      img {
        width: 100%;
        height: 180px;
        object-fit: cover;
        display: block;
      }
      .img-fields {
        padding: 12px;
        display: grid;
        gap: 8px;
      }
      .row-actions {
        display: flex;
        justify-content: flex-end;
      }
      .loading {
        min-height: 40dvh;
        display: grid;
        place-items: center;
      }

      /* Drag & drop visuals */
      .cdk-drag-preview {
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        border-radius: 12px;
      }
    `,
  ],
})
export class TopicEditorComponent implements OnInit, HasUnsavedChanges {
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly topics = inject(TopicsService);
  protected readonly loading = inject(LoadingService);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = signal<string | null>(null);
  readonly topic = signal<Topic | null>(null);
  readonly gradeName = computed(() => {
    const t = this.topic();
    if (!t) return '';
    return GRADES.find((g) => g.id === t.gradeId)?.name ?? t.gradeId;
  });
  saving = false;
  uploading = false;
  reordering = false;
  deleting = false;
  dragPreviewWidth = 0;

  readonly langs: LanguageCode[] = SUPPORTED_LANGUAGES;
  readonly selectedLang = signal<LanguageCode>('en');

  readonly form = this.fb.nonNullable.group({
    order: [0, [Validators.required, Validators.min(0)]],
    name: ['', Validators.required],
    description: [''],
  });

  private readonly patchOnLangChange = effect(() => {
    const t = this.topic();
    const lang = this.selectedLang();
    if (t) {
      this.form.patchValue(
        { order: t.order ?? 0, name: t.name[lang] ?? '', description: t.description[lang] ?? '' },
        { emitEvent: false },
      );
    }
  });

  ngOnInit(): void {
    // Show global overlay during initial topic load (first emission only), immediate
    this.loading.beginImmediate(180);
    let firstEmission = true;

    this.route.paramMap
      .pipe(
        map((pm) => pm.get('id')),
        filter((id): id is string => !!id),
        distinctUntilChanged(),
        tap((id) => this.id.set(id)),
        switchMap((id) => this.topics.get$(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((t) => {
        this.topic.set(t ?? null);
        if (firstEmission) {
          this.loading.end();
          firstEmission = false;
        }
      });
  }

  async onSave() {
    const id = this.id();
    const current = this.topic();
    if (!id || !current || this.form.invalid) return;
    this.saving = true;
    try {
      // Ensure the global overlay is visible for this explicit save action
      this.loading.beginImmediate(180);
      const formValue = this.form.getRawValue();
      const lang = this.selectedLang();
      const name = { ...current.name, [lang]: formValue.name };
      const description = { ...current.description, [lang]: formValue.description };
      await this.topics.update(id, { order: formValue.order, name, description });
      this.form.markAsPristine();
      this.snack.open('Topic saved', 'OK', { duration: 1500 });
    } catch {
      this.snack.open('Failed to save topic', 'Dismiss', { duration: 3000 });
    } finally {
      this.loading.end();
      this.saving = false;
    }
  }

  async onFileSelected(event: Event) {
    const id = this.id();
    if (!id) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading = true;
    try {
      const titles: LocalizedTitles = { en: '', cs: '', es: '' };
      await this.topics.uploadImage(id, file, titles);
      this.snack.open('Image uploaded', 'OK', { duration: 1500 });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      this.snack.open(msg, 'Dismiss', { duration: 3000 });
    } finally {
      this.uploading = false;
      (event.target as HTMLInputElement).value = '';
    }
  }

  async onTitleChange(img: ImageMeta, lang: LanguageCode, value: string) {
    const id = this.id();
    const topic = this.topic();
    if (!id || !topic) return;
    const images = (topic.images || []).map((i) =>
      i.id === img.id ? { ...i, titles: { ...i.titles, [lang]: value } } : i,
    );
    this.loading.beginImmediate(150);
    try {
      await this.topics.update(id, { images });
    } finally {
      this.loading.end();
    }
  }

  languageLabel(code: LanguageCode): string {
    return LANGUAGE_LABELS[code] ?? code.toUpperCase();
  }

  async deleteImage(img: ImageMeta) {
    const id = this.id();
    if (!id) return;
    const yes = confirm('Remove this image?');
    if (!yes) return;
    this.deleting = true;
    try {
      await this.topics.deleteImage(id, img.id);
      this.snack.open('Image removed', 'OK', { duration: 1500 });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to remove image';
      this.snack.open(msg, 'Dismiss', { duration: 3000 });
    } finally {
      this.deleting = false;
    }
  }

  async dropImages(event: CdkDragDrop<ImageMeta[]>) {
    const id = this.id();
    const t = this.topic();
    if (!id || !t) return;
    const { previousIndex, currentIndex } = event;
    if (previousIndex === currentIndex) return;

    const prevImages = (t.images || []).slice();
    const nextImages = (t.images || []).slice();
    moveItemInArray(nextImages, previousIndex, currentIndex);

    // Optimistic update
    this.reordering = true;
    this.topic.set({ ...t, images: nextImages });
    try {
      this.loading.beginImmediate(180);
      await this.topics.update(id, { images: nextImages });
      this.snack.open('Order saved', 'OK', { duration: 1000 });
    } catch (e: unknown) {
      // Revert on failure
      this.topic.set({ ...t, images: prevImages });
      const msg = e instanceof Error ? e.message : 'Failed to save order';
      this.snack.open(msg, 'Dismiss', { duration: 3000 });
    } finally {
      this.loading.end();
      this.reordering = false;
    }
  }

  onDragStart(event: CdkDragStart<ImageMeta>) {
    try {
      const el = event.source.element.nativeElement as HTMLElement;
      const rect = el.getBoundingClientRect();
      this.dragPreviewWidth = Math.round(rect.width);
    } catch {
      this.dragPreviewWidth = 0;
    }
  }

  onDragEnd() {
    this.dragPreviewWidth = 0;
  }
}
