import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MATERIAL_IMPORTS } from '../../shared/material.imports';
import { TopicsService } from '../../services/topics.service';
import { ImageMeta, LocalizedTitles, Topic } from '../../shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { MarkdownModule, MarkdownComponent } from 'ngx-markdown';
import {
  CdkDragDrop,
  CdkDragStart,
  CdkDragEnd,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

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
    <div class="container">
      <div class="header">
        <h2>Edit Topic</h2>
        <span class="topic-id">#{{ t.id }}</span>
        <span class="spacer"></span>
        <a mat-stroked-button color="primary" [routerLink]="['/topics']">
          <mat-icon>arrow_back</mat-icon>
          Back to list
        </a>
      </div>
      <mat-divider />

      <form [formGroup]="form" class="form" (ngSubmit)="onSave()">
        <mat-form-field appearance="outline">
          <mat-label>Topic name</mat-label>
          <input matInput formControlName="name" />
          <mat-error *ngIf="form.controls.name.invalid">Name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Description (Markdown)</mat-label>
          <textarea matInput formControlName="description" rows="8"></textarea>
        </mat-form-field>

        <div class="preview">
          <h3>Markdown preview</h3>
          <markdown [data]="form.controls.description.value || ''"></markdown>
        </div>

        <div class="actions">
          <button mat-flat-button color="primary" [disabled]="form.invalid || saving">Save</button>
        </div>
      </form>

      <mat-divider />

      <section class="images">
        <h3>Images</h3>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          (change)="onFileSelected($event)"
          [disabled]="uploading || t.images.length >= 10"
        />
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
              <mat-form-field appearance="outline">
                <mat-label>Title (EN)</mat-label>
                <input
                  matInput
                  [value]="img.titles.en || ''"
                  (change)="onTitleChange(img, 'en', $any($event.target).value)"
                />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Titulek (CS)</mat-label>
                <input
                  matInput
                  [value]="img.titles.cs || ''"
                  (change)="onTitleChange(img, 'cs', $any($event.target).value)"
                />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Título (ES)</mat-label>
                <input
                  matInput
                  [value]="img.titles.es || ''"
                  (change)="onTitleChange(img, 'es', $any($event.target).value)"
                />
              </mat-form-field>
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
    } @else {
    <div class="loading">
      <mat-progress-spinner mode="indeterminate" diameter="36"></mat-progress-spinner>
    </div>
    }
  `,
  styles: [
    `
      .container {
        padding: 16px;
        display: grid;
        gap: 16px;
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
      .images {
        display: grid;
        gap: 12px;
      }
      .grid {
        display: flex;
        flex-wrap: nowrap; /* keep a single row */
        gap: 16px;
        align-items: stretch;
        overflow-x: auto;
        overscroll-behavior-x: contain;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 4px; /* space for scrollbar on some platforms */
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
export class TopicEditorComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly topics = inject(TopicsService);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);

  private sub?: Subscription;

  readonly id = signal<string | null>(null);
  readonly topic = signal<Topic | null>(null);
  saving = false;
  uploading = false;
  reordering = false;
  deleting = false;
  dragPreviewWidth = 0;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
  });

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(async (pm) => {
      const id = pm.get('id');
      if (!id) return;
      this.id.set(id);
      this.topics.get$(id).subscribe((t) => {
        this.topic.set(t ?? null);
        if (t) {
          this.form.patchValue(
            { name: t.name, description: t.description ?? '' },
            { emitEvent: false }
          );
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  async onSave() {
    const id = this.id();
    if (!id || this.form.invalid) return;
    this.saving = true;
    try {
      await this.topics.update(id, this.form.getRawValue());
      this.snack.open('Topic saved', 'OK', { duration: 1500 });
    } catch {
      this.snack.open('Failed to save topic', 'Dismiss', { duration: 3000 });
    } finally {
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

  async onTitleChange(img: ImageMeta, lang: 'en' | 'cs' | 'es', value: string) {
    const id = this.id();
    const topic = this.topic();
    if (!id || !topic) return;
    const images = (topic.images || []).map((i) =>
      i.id === img.id ? { ...i, titles: { ...i.titles, [lang]: value } } : i
    );
    await this.topics.update(id, { images });
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
      await this.topics.update(id, { images: nextImages });
      this.snack.open('Order saved', 'OK', { duration: 1000 });
    } catch (e: unknown) {
      // Revert on failure
      this.topic.set({ ...t, images: prevImages });
      const msg = e instanceof Error ? e.message : 'Failed to save order';
      this.snack.open(msg, 'Dismiss', { duration: 3000 });
    } finally {
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
