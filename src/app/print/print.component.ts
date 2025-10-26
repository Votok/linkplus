import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../shared/material.imports';
import { TopicsService } from '../services/topics.service';
import { AsyncPipe } from '@angular/common';
import { Topic, ImageMeta } from '../shared/models';

@Component({
  standalone: true,
  selector: 'app-print',
  imports: [CommonModule, AsyncPipe, ...MATERIAL_IMPORTS],
  template: `
    <div class="container">
      <div class="controls no-print">
        <mat-form-field appearance="outline">
          <mat-label>Topic</mat-label>
          <mat-select [(value)]="selectedTopicId">
            @for (t of topics$ | async; track t.id) {
            <mat-option [value]="t.id">{{ t.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Language</mat-label>
          <mat-select [(value)]="lang">
            <mat-option value="en">English</mat-option>
            <mat-option value="cs">Čeština</mat-option>
            <mat-option value="es">Español</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-flat-button color="primary" (click)="print()">
          <mat-icon>print</mat-icon>
          Print
        </button>
      </div>

      @if (currentTopic(); as topic) {
      <div class="print-page">
        <h1 class="title">{{ topic.name }}</h1>
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
      .title {
        text-align: center;
        margin-bottom: 12mm;
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

      @media print {
        .no-print {
          display: none !important;
        }
        .print-page {
          box-shadow: none;
          padding: 10mm;
          width: auto;
          min-height: auto;
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

  selectedTopicId: string | null = null;
  lang: 'en' | 'cs' | 'es' = 'en';

  readonly topics$ = this.topics.list$();
  readonly currentTopic = signal<Topic | null>(null);

  constructor() {
    this.topics$.subscribe((list) => {
      if (!this.selectedTopicId && list.length) {
        this.selectedTopicId = list[0].id;
      }
      this.currentTopic.set(list.find((t) => t.id === this.selectedTopicId) || null);
    });
  }

  getTitle(img: ImageMeta): string {
    return (img?.titles?.[this.lang] || '').trim();
  }

  print() {
    window.print();
  }
}
