import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MATERIAL_IMPORTS } from '../../shared/material.imports';
import { GradeSettingsService } from '../../services/grade-settings.service';
import { MarkdownModule } from 'ngx-markdown';
import {
  GRADES,
  LanguageCode,
  LocalizedTitles,
  RTL_LANGUAGES,
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  emptyLocalizedTitles,
} from '../../shared/models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type GradePrintMode = 'hardCover' | 'homeLanguage';

@Component({
  standalone: true,
  selector: 'app-grade-print',
  imports: [CommonModule, RouterLink, MarkdownModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="container">
      <div class="controls no-print">
        <span class="label">{{ gradeName }}</span>
        <span class="label mode-label">{{
          mode === 'hardCover' ? 'Hard Cover' : 'Home Language'
        }}</span>

        <mat-form-field appearance="outline">
          <mat-label>Language</mat-label>
          <mat-select [(value)]="lang">
            @for (l of langs; track l) {
              <mat-option [value]="l">{{ languageLabel(l) }} ({{ l.toUpperCase() }})</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <button mat-flat-button color="primary" (click)="print()" [disabled]="!hasContent()">
          <mat-icon>print</mat-icon>
          Print
        </button>

        <span class="spacer"></span>
        <a mat-stroked-button [routerLink]="['/grades', gradeId, 'setup']">
          <mat-icon>arrow_back</mat-icon>
          Back to Setup
        </a>
      </div>

      @if (mode === 'hardCover') {
        @if (hardCoverPage1()[lang]) {
          <div class="print-page grade-page" [dir]="textDir">
            <div class="grade-content">
              <markdown [data]="hardCoverPage1()[lang]"></markdown>
            </div>
          </div>
        }
        @if (hardCoverPage2()[lang]) {
          <div class="print-page grade-page" [dir]="textDir">
            <div class="grade-content">
              <markdown [data]="hardCoverPage2()[lang]"></markdown>
            </div>
          </div>
        }
      }

      @if (mode === 'homeLanguage' && homeLanguage()[lang]) {
        <div class="print-page grade-page" [dir]="textDir">
          <div class="grade-content">
            <markdown [data]="homeLanguage()[lang]"></markdown>
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
      .label {
        font-weight: 500;
        font-size: 16px;
      }
      .mode-label {
        opacity: 0.7;
      }
      .spacer {
        flex: 1 1 auto;
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
        .container {
          padding: 0 !important;
        }
        .no-print {
          display: none !important;
        }
        .print-page {
          box-shadow: none;
          padding: 10mm;
          width: auto;
          min-height: auto;
        }
        .print-page + .print-page {
          margin-top: 0;
        }
        .grade-page {
          page-break-after: always;
          min-height: calc(100vh - 20mm);
        }
        @page {
          size: A4;
          margin: 10mm;
        }
      }
    `,
  ],
})
export class GradePrintComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly gradeSettingsService = inject(GradeSettingsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly langs: LanguageCode[] = SUPPORTED_LANGUAGES;
  lang: LanguageCode = 'en';

  gradeId = '';
  gradeName = '';
  mode: GradePrintMode = 'hardCover';

  readonly hardCoverPage1 = signal<LocalizedTitles>(emptyLocalizedTitles());
  readonly hardCoverPage2 = signal<LocalizedTitles>(emptyLocalizedTitles());
  readonly homeLanguage = signal<LocalizedTitles>(emptyLocalizedTitles());

  get textDir(): 'rtl' | 'ltr' {
    return RTL_LANGUAGES.has(this.lang) ? 'rtl' : 'ltr';
  }

  hasContent(): boolean {
    if (this.mode === 'hardCover') {
      return !!(this.hardCoverPage1()[this.lang] || this.hardCoverPage2()[this.lang]);
    }
    return !!this.homeLanguage()[this.lang];
  }

  ngOnInit(): void {
    this.gradeId = this.route.snapshot.paramMap.get('gradeId') ?? '';
    this.gradeName = GRADES.find((g) => g.id === this.gradeId)?.name ?? this.gradeId;
    this.mode = (this.route.snapshot.queryParamMap.get('mode') as GradePrintMode) || 'hardCover';

    this.gradeSettingsService
      .get$(this.gradeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((gs) => {
        if (gs) {
          this.hardCoverPage1.set(normalizeField(gs.hardCoverPrintOut));
          this.hardCoverPage2.set(normalizeField(gs.hardCoverPrintOutPage2));
          this.homeLanguage.set(normalizeField(gs.homeLanguagePrintOut));
        }
      });
  }

  languageLabel(code: LanguageCode): string {
    return LANGUAGE_LABELS[code] ?? code.toUpperCase();
  }

  print() {
    setTimeout(() => {
      window.print();
    });
  }
}

function normalizeField(value: unknown): LocalizedTitles {
  if (typeof value === 'string') {
    return { ...emptyLocalizedTitles(), en: value };
  }
  if (value && typeof value === 'object') {
    return value as LocalizedTitles;
  }
  return emptyLocalizedTitles();
}
