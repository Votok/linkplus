import {
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MATERIAL_IMPORTS } from '../../shared/material.imports';
import { GradeSettingsService } from '../../services/grade-settings.service';
import { GRADES } from '../../shared/models';
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

        <form [formGroup]="form" class="form" (ngSubmit)="onSave()">
          <section>
            <h3>Hard Cover Print-Out</h3>
            <p class="hint">This will be the cover page for the folder.</p>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Hard Cover Print-Out (Markdown)</mat-label>
              <textarea matInput formControlName="hardCoverPrintOut" rows="10"></textarea>
            </mat-form-field>
            <div class="preview">
              <h4>Preview</h4>
              <markdown [data]="form.controls.hardCoverPrintOut.value || ''"></markdown>
            </div>
          </section>

          <mat-divider />

          <section>
            <h3>Home Language Print-Out</h3>
            <p class="hint">This will be the first page inside the folder.</p>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Home Language Print-Out (Markdown)</mat-label>
              <textarea matInput formControlName="homeLanguagePrintOut" rows="10"></textarea>
            </mat-form-field>
            <div class="preview">
              <h4>Preview</h4>
              <markdown [data]="form.controls.homeLanguagePrintOut.value || ''"></markdown>
            </div>
          </section>

          <div class="actions">
            <button mat-flat-button color="primary" [disabled]="form.pristine || saving">
              Save
            </button>
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
        gap: 24px;
      }
      section {
        display: grid;
        gap: 12px;
      }
      section h3 {
        margin: 0;
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

  saving = false;

  readonly form = this.fb.nonNullable.group({
    hardCoverPrintOut: [''],
    homeLanguagePrintOut: [''],
  });

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
          this.form.patchValue(
            {
              hardCoverPrintOut: settings.hardCoverPrintOut ?? '',
              homeLanguagePrintOut: settings.homeLanguagePrintOut ?? '',
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
      const value = this.form.getRawValue();
      await this.gradeSettings.save(gradeId, value);
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
