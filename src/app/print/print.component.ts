import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../shared/material.imports';
import { TopicsService } from '../services/topics.service';
import { GradeSettingsService } from '../services/grade-settings.service';
import {
  Topic,
  ImageMeta,
  LanguageCode,
  GRADES,
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  LocalizedTitles,
  emptyLocalizedTitles,
} from '../shared/models';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MarkdownModule } from 'ngx-markdown';
import { switchMap, map } from 'rxjs';

type PrintMode = 'topic' | 'hardCover' | 'homeLanguage';

@Component({
  standalone: true,
  selector: 'app-print',
  imports: [CommonModule, MarkdownModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="container">
      <div class="controls no-print">
        <mat-form-field appearance="outline">
          <mat-label>Grade</mat-label>
          <mat-select [value]="selectedGradeId()" (valueChange)="onGradeChange($event)">
            @for (g of grades; track g.id) {
              <mat-option [value]="g.id">{{ g.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Topic</mat-label>
          <mat-select [value]="selectedTopicId()" (valueChange)="onTopicSelectionChange($event)">
            @for (t of filteredTopics(); track t.id) {
              <mat-option [value]="t.id">{{ t.name.en }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Language</mat-label>
          <mat-select [(value)]="lang">
            @for (l of langs; track l) {
              <mat-option [value]="l">{{ languageLabel(l) }} ({{ l.toUpperCase() }})</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <button
          mat-flat-button
          color="primary"
          (click)="printMode('topic')"
          [disabled]="!currentTopic()"
        >
          <mat-icon>print</mat-icon>
          Print Topic
        </button>
        <button
          mat-stroked-button
          (click)="printMode('hardCover')"
          [disabled]="!gradeSettings()?.hardCoverPrintOut?.[lang]"
        >
          <mat-icon>print</mat-icon>
          Print Hard Cover
        </button>
        <button
          mat-stroked-button
          (click)="printMode('homeLanguage')"
          [disabled]="!gradeSettings()?.homeLanguagePrintOut?.[lang]"
        >
          <mat-icon>print</mat-icon>
          Print Home Language
        </button>
      </div>

      @if (activePrintMode() !== 'topic' || !currentTopic()) {
        @if (gradeSettings(); as gs) {
          @if (activePrintMode() !== 'homeLanguage' && gs.hardCoverPrintOut[lang]) {
            <div class="print-page grade-page">
              <div class="grade-content">
                <markdown [data]="gs.hardCoverPrintOut[lang]"></markdown>
              </div>
            </div>
          }
          @if (activePrintMode() !== 'hardCover' && gs.homeLanguagePrintOut[lang]) {
            <div class="print-page grade-page">
              <div class="grade-content">
                <markdown [data]="gs.homeLanguagePrintOut[lang]"></markdown>
              </div>
            </div>
          }
        }
      }

      @if (activePrintMode() === 'topic' && currentTopic(); as topic) {
        <div class="print-page cover-page">
          <h1 class="cover-title">{{ topic.name[lang] }}</h1>
          <div class="cover-description">
            <markdown [data]="getDescription()"></markdown>
          </div>
        </div>

        <div class="print-page images-page">
          <h2 class="images-title">{{ topic.name[lang] }}</h2>
          <div class="images">
            @for (img of topic.images; track img.id) {
              <div class="img">
                <img [src]="img.url" [alt]="getTitle(img)" />
                <div class="caption">{{ getTitle(img) }}</div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .container {
        padding: 16px;
      }
      .controls {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }
      .print-page {
        background: white;
        color: black;
        padding: 16mm;
        width: 210mm;
        min-height: 297mm;
        box-shadow: 0 0 0.5mm rgba(0, 0, 0, 0.1);
      }
      .print-page + .print-page {
        margin-top: 24px;
      }
      /* Cover page */
      .cover-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .cover-title {
        font-size: 24pt;
        text-align: center;
        margin-bottom: 12mm;
      }
      .cover-description {
        max-width: 100%;
        font-size: 12pt;
        line-height: 1.6;
      }
      /* Images page */
      .images-title {
        text-align: center;
        margin-bottom: 8mm;
      }
      .images {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8mm;
      }
      .img img {
        width: 100%;
        height: auto;
        display: block;
      }
      .caption {
        margin-top: 2mm;
        font-size: 12pt;
        text-align: center;
      }
      /* Grade settings pages */
      .grade-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .grade-content {
        max-width: 100%;
        font-size: 12pt;
        line-height: 1.6;
      }

      @media print {
        /* Remove outer container padding so content fits exactly one page */
        .container {
          padding: 0 !important;
        }
        .no-print {
          display: none !important;
        }
        .print-page {
          /* Print-specific page adjustments */
          box-shadow: none;
          padding: 10mm;
          width: auto;
          min-height: auto;
        }
        .print-page + .print-page {
          margin-top: 0;
        }

        /* Cover page: fill one A4 page, then break */
        .cover-page {
          page-break-after: always;
          min-height: calc(100vh - 20mm);
        }
        .cover-title {
          font-size: 24pt;
        }
        .cover-description {
          font-size: 12pt;
        }

        /* Grade pages: fill one A4 page, then break */
        .grade-page {
          page-break-after: always;
          min-height: calc(100vh - 20mm);
        }

        /* Images page: keep everything on one page */
        .images-page {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 20mm);
          overflow: hidden;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Images page title visible in print */
        .images-title {
          font-size: 14pt;
          margin-bottom: 4mm;
          flex-shrink: 0;
        }

        /* 2×4 grid per A4 page with table-like lines */
        .images-page .images {
          flex: 1 1 0;
          min-height: 0;
          grid-template-columns: 1fr 1fr;
          gap: 0; /* use borders as dividers instead of gaps */
          box-sizing: border-box;
          grid-template-rows: repeat(4, 1fr);
        }

        .images-page .images > .img {
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
          min-height: 0;
        }

        /* Single vertical divider between the two columns */
        .images-page .images > .img:nth-child(2n) {
          border-left: 0.2mm solid #000;
        }
        /* Horizontal dividers between rows 1-2, 2-3, 3-4 */
        .images-page .images > .img:not(:nth-child(-n + 2)) {
          border-top: 0.2mm solid #000;
        }

        /* Image scales within fixed cell, caption keeps its size */
        .images-page .images > .img img {
          flex: 1 1 0;
          width: 100%;
          min-height: 0;
          object-fit: contain;
          display: block;
        }
        .images-page .caption {
          flex-shrink: 0;
          font-size: 12pt; /* keep captions unchanged */
          line-height: 1.2;
          margin-top: 2mm;
          margin-bottom: 2mm; /* add space so caption doesn't sit on the separator line */
          text-align: center;
        }
        @page {
          size: A4;
          margin: 10mm;
        }
      }
    `,
  ],
})
export class PrintComponent {
  private readonly topics = inject(TopicsService);
  private readonly gradeSettingsService = inject(GradeSettingsService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly grades = GRADES;
  readonly langs: LanguageCode[] = SUPPORTED_LANGUAGES;
  readonly topicsList = signal<Topic[]>([]);

  selectedGradeId = signal(GRADES[0].id);
  selectedTopicId = signal<string | null>(null);
  activePrintMode = signal<PrintMode>('topic');
  lang: LanguageCode = 'en';

  readonly gradeSettings = toSignal(
    toObservable(this.selectedGradeId).pipe(
      switchMap((id) => this.gradeSettingsService.get$(id)),
      map((gs) =>
        gs
          ? {
              ...gs,
              hardCoverPrintOut: normalizeField(gs.hardCoverPrintOut),
              homeLanguagePrintOut: normalizeField(gs.homeLanguagePrintOut),
            }
          : undefined,
      ),
    ),
  );

  readonly filteredTopics = computed(() => {
    const gradeId = this.selectedGradeId();
    return this.topicsList().filter((t) => t.gradeId === gradeId);
  });

  readonly currentTopic = computed<Topic | null>(() => {
    const id = this.selectedTopicId();
    return this.filteredTopics().find((t) => t.id === id) ?? null;
  });

  constructor() {
    const qpId = this.route.snapshot.queryParamMap.get('topic');
    if (qpId) this.selectedTopicId.set(qpId);

    this.topics
      .list$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((list) => {
        this.topicsList.set(list);

        // If we have a query-param topic, derive its grade
        const qpTopic = qpId ? list.find((t) => t.id === qpId) : null;
        if (qpTopic) {
          this.selectedGradeId.set(qpTopic.gradeId);
        }

        // Auto-select first topic in grade if none selected
        if (!this.selectedTopicId() || !list.find((t) => t.id === this.selectedTopicId())) {
          const filtered = list.filter((t) => t.gradeId === this.selectedGradeId());
          if (filtered.length) {
            this.selectedTopicId.set(filtered[0].id);
          }
        }
      });
  }

  onGradeChange(gradeId: string) {
    this.selectedGradeId.set(gradeId);
    const filtered = this.topicsList().filter((t) => t.gradeId === gradeId);
    this.selectedTopicId.set(filtered.length ? filtered[0].id : null);
  }

  onTopicSelectionChange(id: string) {
    this.selectedTopicId.set(id);
  }

  getTitle(img: ImageMeta): string {
    return (img?.titles?.[this.lang] || '').trim();
  }

  getDescription(): string {
    const topic = this.currentTopic();
    return topic?.description?.[this.lang] ?? '';
  }

  languageLabel(code: LanguageCode): string {
    return LANGUAGE_LABELS[code] ?? code.toUpperCase();
  }

  printMode(mode: PrintMode) {
    this.activePrintMode.set(mode);
    // Wait for Angular to re-render the visible pages before printing
    setTimeout(() => {
      window.print();
    });
  }
}

/** Handle legacy plain-string values from Firestore (pre-migration). */
function normalizeField(value: unknown): LocalizedTitles {
  if (typeof value === 'string') {
    return { ...emptyLocalizedTitles(), en: value };
  }
  if (value && typeof value === 'object') {
    return value as LocalizedTitles;
  }
  return emptyLocalizedTitles();
}
