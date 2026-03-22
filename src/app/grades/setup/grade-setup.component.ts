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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MATERIAL_IMPORTS } from '../../shared/material.imports';
import { GradeSettingsService } from '../../services/grade-settings.service';
import {
  GRADES,
  GradeSettings,
  LanguageCode,
  LocalizedTitles,
  RTL_LANGUAGES,
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  emptyLocalizedTitles,
} from '../../shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, map, switchMap, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MarkdownModule, MarkdownComponent } from 'ngx-markdown';
import { LoadingService } from '../../services/loading.service';
import { HasUnsavedChanges } from '../../auth/unsaved-changes.guard';

@Component({
  standalone: true,
  selector: 'app-grade-setup',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MarkdownModule,
    MarkdownComponent,
    ...MATERIAL_IMPORTS,
  ],
  template: `
    <div class="page">
      <div class="container">
        <div class="header">
          <h2>Grade Setup</h2>
          <mat-chip>{{ gradeName() }}</mat-chip>
          <span class="spacer"></span>
          <a
            mat-stroked-button
            color="primary"
            [routerLink]="['/topics']"
            [queryParams]="{ grade: gradeId() }"
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
                <mat-option [value]="l">{{ languageLabel(l) }} ({{ l.toUpperCase() }})</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <form [formGroup]="form" class="form" (ngSubmit)="onSave()">
          <mat-tab-group animationDuration="200ms">
            <mat-tab label="Hard Cover – Page 1">
              <div class="tab-content">
                <p class="hint">First page of the hard cover for the folder.</p>
                <div class="field-with-hint">
                  <mat-form-field appearance="outline" class="full">
                    <mat-label>Hard Cover Page 1 (Markdown)</mat-label>
                    <textarea
                      matInput
                      formControlName="hardCoverPrintOut"
                      rows="10"
                      [dir]="textDir()"
                    ></textarea>
                  </mat-form-field>
                  @if (selectedLang() !== 'en' && currentSettings()?.hardCoverPrintOut?.en) {
                    <span
                      class="en-badge"
                      [matTooltip]="currentSettings()!.hardCoverPrintOut.en"
                      matTooltipPosition="above"
                      >EN</span
                    >
                  }
                </div>
                <div class="preview" [dir]="textDir()">
                  <h4>Preview</h4>
                  <markdown [data]="form.controls.hardCoverPrintOut.value || ''"></markdown>
                </div>
              </div>
            </mat-tab>

            <mat-tab label="Hard Cover – Page 2">
              <div class="tab-content">
                <p class="hint">Second page of the hard cover for the folder.</p>
                <div class="field-with-hint">
                  <mat-form-field appearance="outline" class="full">
                    <mat-label>Hard Cover Page 2 (Markdown)</mat-label>
                    <textarea
                      matInput
                      formControlName="hardCoverPrintOutPage2"
                      rows="10"
                      [dir]="textDir()"
                    ></textarea>
                  </mat-form-field>
                  @if (selectedLang() !== 'en' && currentSettings()?.hardCoverPrintOutPage2?.en) {
                    <span
                      class="en-badge"
                      [matTooltip]="currentSettings()!.hardCoverPrintOutPage2.en"
                      matTooltipPosition="above"
                      >EN</span
                    >
                  }
                </div>
                <div class="preview" [dir]="textDir()">
                  <h4>Preview</h4>
                  <markdown [data]="form.controls.hardCoverPrintOutPage2.value || ''"></markdown>
                </div>
              </div>
            </mat-tab>

            <mat-tab label="Home Language">
              <div class="tab-content">
                <p class="hint">This will be the first page inside the folder.</p>
                <div class="field-with-hint">
                  <mat-form-field appearance="outline" class="full">
                    <mat-label>Home Language Print-Out (Markdown)</mat-label>
                    <textarea
                      matInput
                      formControlName="homeLanguagePrintOut"
                      rows="10"
                      [dir]="textDir()"
                    ></textarea>
                  </mat-form-field>
                  @if (selectedLang() !== 'en' && currentSettings()?.homeLanguagePrintOut?.en) {
                    <span
                      class="en-badge"
                      [matTooltip]="currentSettings()!.homeLanguagePrintOut.en"
                      matTooltipPosition="above"
                      >EN</span
                    >
                  }
                </div>
                <div class="preview" [dir]="textDir()">
                  <h4>Preview</h4>
                  <markdown [data]="form.controls.homeLanguagePrintOut.value || ''"></markdown>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>

          <div class="actions">
            <button mat-flat-button color="primary" [disabled]="form.pristine || saving">
              Save
            </button>
            <span class="spacer"></span>
            <a
              mat-stroked-button
              [routerLink]="['/grades', gradeId(), 'print']"
              [queryParams]="{ mode: 'hardCover' }"
            >
              <mat-icon>print</mat-icon>
              Print Hard Cover
            </a>
            <a
              mat-stroked-button
              [routerLink]="['/grades', gradeId(), 'print']"
              [queryParams]="{ mode: 'homeLanguage' }"
            >
              <mat-icon>print</mat-icon>
              Print Home Language
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .page {
        height: 100%;
        overflow-y: auto;
      }
      .container {
        padding: 16px;
        display: grid;
        gap: 16px;
        max-width: 920px;
        margin: 0 auto;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .spacer {
        flex: 1 1 auto;
      }
      .form {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .tab-content {
        display: grid;
        gap: 12px;
        padding-top: 16px;
      }
      .hint {
        margin: 0;
        opacity: 0.7;
        font-size: 13px;
      }
      .full {
        width: 100%;
      }
      .preview {
        border: 1px dashed rgba(0, 0, 0, 0.2);
        padding: 12px;
        border-radius: 8px;
        background: #fafafa;
      }
      .preview h4 {
        margin: 0 0 8px;
        opacity: 0.6;
        font-size: 13px;
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
    `,
  ],
})
export class GradeSetupComponent implements OnInit, HasUnsavedChanges {
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
  private readonly gradeSettings = inject(GradeSettingsService);
  protected readonly loading = inject(LoadingService);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly gradeId = signal<string | null>(null);
  readonly gradeName = computed(() => {
    const id = this.gradeId();
    return GRADES.find((g) => g.id === id)?.name ?? id ?? '';
  });

  readonly langs: LanguageCode[] = SUPPORTED_LANGUAGES;
  readonly selectedLang = signal<LanguageCode>('en');
  readonly textDir = computed(() => (RTL_LANGUAGES.has(this.selectedLang()) ? 'rtl' : 'ltr'));
  readonly currentSettings = signal<GradeSettings | null>(null);

  saving = false;

  readonly form = this.fb.nonNullable.group({
    hardCoverPrintOut: [''],
    hardCoverPrintOutPage2: [''],
    homeLanguagePrintOut: [''],
  });

  private readonly patchOnLangChange = effect(() => {
    const settings = this.currentSettings();
    const lang = this.selectedLang();
    if (settings) {
      this.form.patchValue(
        {
          hardCoverPrintOut: settings.hardCoverPrintOut?.[lang] ?? '',
          hardCoverPrintOutPage2: settings.hardCoverPrintOutPage2?.[lang] ?? '',
          homeLanguagePrintOut: settings.homeLanguagePrintOut?.[lang] ?? '',
        },
        { emitEvent: false },
      );
    }
  });

  languageLabel(code: LanguageCode): string {
    return LANGUAGE_LABELS[code] ?? code.toUpperCase();
  }

  /** Handle legacy plain-string values from Firestore (pre-migration). */
  private normalizeField(value: unknown): LocalizedTitles {
    if (typeof value === 'string') {
      return { ...emptyLocalizedTitles(), en: value };
    }
    if (value && typeof value === 'object') {
      return value as LocalizedTitles;
    }
    return emptyLocalizedTitles();
  }

  ngOnInit(): void {
    this.loading.beginImmediate(180);
    let firstEmission = true;

    this.route.paramMap
      .pipe(
        map((pm) => pm.get('gradeId')),
        filter((id): id is string => !!id),
        distinctUntilChanged(),
        switchMap((id) => {
          this.gradeId.set(id);
          return this.gradeSettings.get$(id);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((settings) => {
        if (settings) {
          const normalized: GradeSettings = {
            ...settings,
            hardCoverPrintOut: this.normalizeField(settings.hardCoverPrintOut),
            hardCoverPrintOutPage2: this.normalizeField(settings.hardCoverPrintOutPage2),
            homeLanguagePrintOut: this.normalizeField(settings.homeLanguagePrintOut),
          };
          this.currentSettings.set(normalized);
          const lang = this.selectedLang();
          this.form.patchValue(
            {
              hardCoverPrintOut: normalized.hardCoverPrintOut[lang] ?? '',
              hardCoverPrintOutPage2: normalized.hardCoverPrintOutPage2[lang] ?? '',
              homeLanguagePrintOut: normalized.homeLanguagePrintOut[lang] ?? '',
            },
            { emitEvent: false },
          );
        }
        if (firstEmission) {
          this.loading.end();
          firstEmission = false;
          this.form.markAsPristine();
        }
      });
  }

  async onSave() {
    const gradeId = this.gradeId();
    if (!gradeId) return;
    this.saving = true;
    try {
      this.loading.beginImmediate(180);
      const formValue = this.form.getRawValue();
      const lang = this.selectedLang();
      const current = this.currentSettings();
      const hardCoverPrintOut = {
        ...(current?.hardCoverPrintOut ?? emptyLocalizedTitles()),
        [lang]: formValue.hardCoverPrintOut,
      };
      const hardCoverPrintOutPage2 = {
        ...(current?.hardCoverPrintOutPage2 ?? emptyLocalizedTitles()),
        [lang]: formValue.hardCoverPrintOutPage2,
      };
      const homeLanguagePrintOut = {
        ...(current?.homeLanguagePrintOut ?? emptyLocalizedTitles()),
        [lang]: formValue.homeLanguagePrintOut,
      };
      await this.gradeSettings.save(gradeId, {
        hardCoverPrintOut,
        hardCoverPrintOutPage2,
        homeLanguagePrintOut,
      });
      this.form.markAsPristine();
      this.snack.open('Grade settings saved', 'OK', { duration: 1500 });
    } catch {
      this.snack.open('Failed to save settings', 'Dismiss', { duration: 3000 });
    } finally {
      this.loading.end();
      this.saving = false;
    }
  }
}
