import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MATERIAL_IMPORTS } from '../../shared/material.imports';
import { TopicsService } from '../../services/topics.service';
import { Topic } from '../../shared/models';

@Component({
  standalone: true,
  selector: 'app-topics-list',
  imports: [CommonModule, RouterLink, AsyncPipe, ...MATERIAL_IMPORTS],
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
        <mat-list-item *ngFor="let t of topics$ | async as list">
          <div matListItemTitle>{{ t.name }}</div>
          <div matListItemLine>{{ t.description || 'No description' }}</div>
          <div class="spacer"></div>
          <button mat-icon-button [routerLink]="['/topics', t.id, 'edit']" aria-label="Edit">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button color="warn" (click)="deleteTopic(t)" aria-label="Delete">
            <mat-icon>delete</mat-icon>
          </button>
        </mat-list-item>
      </mat-list>

      <p class="hint" *ngIf="(topics$ | async)?.length === 0">
        No topics yet. Use "Add Topic" to create one.
      </p>
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
      .hint {
        opacity: 0.7;
      }
    `,
  ],
})
export class TopicsListComponent {
  private readonly topics = inject(TopicsService);
  private readonly router = inject(Router);

  readonly topics$ = this.topics.list$();

  async addTopic() {
    const id = await this.topics.create({ name: 'New Topic', description: '' });
    await this.router.navigate(['/topics', id, 'edit']);
  }

  async deleteTopic(t: Topic) {
    const yes = confirm(`Delete topic "${t.name}"? This cannot be undone.`);
    if (!yes) return;
    await this.topics.remove(t.id);
  }
}
