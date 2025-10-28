import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_IMPORTS } from '../../shared/material.imports';
import { TopicsService } from '../../services/topics.service';
import { Topic } from '../../shared/models';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadingService } from '../../services/loading.service';
import { take } from 'rxjs';

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
          Add Topic
        </button>
      </div>

      <mat-divider />

      <mat-list>
        @for (t of topics(); track t.id) {
        <mat-list-item>
          <div matListItemTitle>{{ t.name }}</div>
          <!-- <div matListItemLine>{{ t.description || 'No description' }}</div> -->
          <div matListItemMeta class="actions">
            <button
              mat-icon-button
              [routerLink]="['/print']"
              [queryParams]="{ topic: t.id }"
              aria-label="Print"
            >
              <mat-icon>print</mat-icon>
            </button>
            <button mat-icon-button [routerLink]="['/topics', t.id, 'edit']" aria-label="Edit">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteTopic(t)" aria-label="Delete">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </mat-list-item>
        }
      </mat-list>

      @if (topics()?.length === 0) {
      <p class="hint">No topics yet. Use "Add Topic" to create one.</p>
      }
    </div>
  `,
  styles: [
    `
      .container {
        padding: 16px;
        display: grid;
        gap: 12px;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .spacer {
        flex: 1 1 auto;
      }
      .actions {
        display: inline-flex;
        gap: 8px;
        align-items: center;
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

  readonly topics = toSignal(this.topicsService.list$());

  ngOnInit(): void {
    // Show overlay until the first list emission arrives
    this.loading.begin();
    this.topicsService
      .list$()
      .pipe(take(1))
      .subscribe({
        next: () => this.loading.end(),
        error: () => this.loading.end(),
      });
  }

  async addTopic() {
    this.loading.beginImmediate(180);
    try {
      const id = await this.topicsService.create({ name: 'New Topic', description: '' });
      await this.router.navigate(['/topics', id, 'edit']);
    } finally {
      this.loading.end();
    }
  }

  async deleteTopic(t: Topic) {
    const yes = confirm(`Delete topic "${t.name}"? This cannot be undone.`);
    if (!yes) return;
    this.loading.beginImmediate(180);
    try {
      await this.topicsService.remove(t.id);
    } finally {
      this.loading.end();
    }
  }
}
