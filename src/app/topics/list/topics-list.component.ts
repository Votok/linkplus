import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_IMPORTS } from '../../shared/material.imports';
import { TopicsService } from '../../services/topics.service';
import { Topic, GRADES } from '../../shared/models';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { LoadingService } from '../../services/loading.service';
import { take, switchMap } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-topics-list',
  imports: [CommonModule, RouterLink, ...MATERIAL_IMPORTS],
  template: `
    <div class="container">
      <div class="header">
        <h2>Topics</h2>
        <button mat-flat-button color="primary" (click)="addTopic()">
          <mat-icon>add</mat-icon>
          Add New Topic
        </button>
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Grade</mat-label>
        <mat-select [value]="selectedGradeId()" (valueChange)="selectedGradeId.set($event)">
          @for (g of grades; track g.id) {
            <mat-option [value]="g.id">{{ g.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-divider />

      <mat-list class="list">
        @for (t of topics(); track t.id) {
          <mat-list-item>
            <div matListItemTitle>
              <span class="order">{{ t.order ?? 0 }}</span> {{ t.name.en }}
            </div>
            <!-- <div matListItemLine>{{ t.description || 'No description' }}</div> -->
            <div matListItemMeta class="actions">
              <button mat-flat-button color="primary" [routerLink]="['/topics', t.id, 'edit']">
                <mat-icon>edit</mat-icon>
                Edit
              </button>
              <button mat-stroked-button [routerLink]="['/print']" [queryParams]="{ topic: t.id }">
                <mat-icon>print</mat-icon>
                Print
              </button>
              <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="More actions">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="deleteTopic(t)" class="menu-warn">
                  <mat-icon>delete</mat-icon>
                  <span>Delete</span>
                </button>
              </mat-menu>
            </div>
          </mat-list-item>
        }
      </mat-list>

      @if (topics()?.length === 0) {
        <p class="hint">No topics yet. Use "Add New Topic" to create one.</p>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .container {
        padding: 16px;
        display: grid;
        gap: 12px;
        height: 100%;
        grid-template-rows: auto auto auto 1fr;
        max-width: 920px;
        margin: 0 auto;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: space-between;
      }
      .spacer {
        flex: 1 1 auto;
      }
      .list {
        overflow: auto;
        -webkit-overflow-scrolling: touch;
      }
      .order {
        display: inline-block;
        min-width: 24px;
        text-align: center;
        font-weight: 600;
        opacity: 0.5;
        margin-right: 4px;
      }
      .actions {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .menu-warn {
        color: var(--mdc-theme-error, #d32f2f);
      }
      .hint {
        opacity: 0.7;
      }
    `,
  ],
})
export class TopicsListComponent implements OnInit {
  private readonly topicsService = inject(TopicsService);
  private readonly router = inject(Router);
  private readonly loading = inject(LoadingService);

  readonly grades = GRADES;
  readonly selectedGradeId = signal(GRADES[0].id);

  private readonly topics$ = toObservable(this.selectedGradeId).pipe(
    switchMap((gradeId) => this.topicsService.listByGrade$(gradeId)),
  );
  readonly topics = toSignal(this.topics$);

  ngOnInit(): void {
    // Show overlay until the first list emission arrives (immediate to avoid race/flicker)
    this.loading.beginImmediate(180);
    this.topics$.pipe(take(1)).subscribe({
      next: () => this.loading.end(),
      error: () => this.loading.end(),
    });
  }

  async addTopic() {
    this.loading.beginImmediate(180);
    try {
      const current = this.topics() ?? [];
      const maxOrder = current.reduce((max, t) => Math.max(max, t.order ?? 0), 0);
      const id = await this.topicsService.create({
        name: { en: 'New Topic', cs: '', es: '' },
        description: { en: '', cs: '', es: '' },
        gradeId: this.selectedGradeId(),
        order: maxOrder + 1,
      });
      await this.router.navigate(['/topics', id, 'edit']);
    } finally {
      this.loading.end();
    }
  }

  async deleteTopic(t: Topic) {
    const yes = confirm(`Delete topic "${t.name.en}"? This cannot be undone.`);
    if (!yes) return;
    this.loading.beginImmediate(180);
    try {
      await this.topicsService.remove(t.id);
    } finally {
      this.loading.end();
    }
  }
}
