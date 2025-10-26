import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../shared/material.imports';
import { TopicsService } from '../services/topics.service';
import { AsyncPipe } from '@angular/common';
import { Topic, ImageMeta } from '../shared/models';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-print',
  imports: [CommonModule, AsyncPipe, ...MATERIAL_IMPORTS],
  template: `
    <div class="container">
      <div class="controls no-print">
        <mat-form-field appearance="outline">
          <mat-label>Topic</mat-label>
          <mat-select [value]="selectedTopicId()" (valueChange)="onTopicSelectionChange($event)">
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
          /* Print-specific page adjustments */
          box-shadow: none;
          padding: 10mm;
          width: auto;
          min-height: auto;
          /* Reserve a predictable space for the title block (content height); bottom spacing is handled by .title margin */
          --title-block: 10mm;
        }

        /* Smaller, tighter headline for print */
        .print-page .title {
          font-size: 14pt;
          line-height: 1.2;
          margin: 0 0 6mm;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-height: var(--title-block);
        }

        /* 2×4 grid per A4 page with table-like lines */
        .print-page .images {
          grid-template-columns: 1fr 1fr;
          gap: 0; /* use borders as dividers instead of gaps */
          border: 0.2mm solid #000; /* outer border */
          box-sizing: border-box;
          /* Four uniform rows that fill the printable height minus paddings, title block and borders */
          grid-auto-rows: calc((100vh - 20mm - var(--title-block) - 6mm - 0.4mm) / 4);
        }

        .print-page .images > .img {
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          /* Avoid breaking a cell across pages */
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Single vertical divider between the two columns */
        .print-page .images > .img:nth-child(2n) {
          border-left: 0.2mm solid #000;
        }
        /* Horizontal dividers between rows 1-2, 2-3, 3-4 */
        .print-page .images > .img:not(:nth-child(-n + 2)) {
          border-top: 0.2mm solid #000;
        }

        /* Image scales within fixed cell, caption keeps its size */
        .print-page .images > .img img {
          flex: 1 1 auto;
          width: 100%;
          height: 100%;
          object-fit: contain;
          min-height: 0;
          display: block;
        }
        .print-page .caption {
          font-size: 12pt; /* keep captions unchanged */
          line-height: 1.2;
          margin-top: 2mm;
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
  private readonly route = inject(ActivatedRoute);

  readonly topics$ = this.topics.list$();
  readonly topicsList = signal<Topic[]>([]);

  selectedTopicId = signal<string | null>(null);
  lang: 'en' | 'cs' | 'es' = 'en';

  readonly currentTopic = computed<Topic | null>(() => {
    const id = this.selectedTopicId();
    return this.topicsList().find((t) => t.id === id) ?? null;
  });

  constructor() {
    const qpId = this.route.snapshot.queryParamMap.get('topic');
    if (qpId) this.selectedTopicId.set(qpId);

    this.topics$.subscribe((list) => {
      this.topicsList.set(list);
      if (!this.selectedTopicId() && list.length) {
        this.selectedTopicId.set(list[0].id);
      }
    });
  }

  onTopicSelectionChange(id: string) {
    this.selectedTopicId.set(id);
  }

  getTitle(img: ImageMeta): string {
    return (img?.titles?.[this.lang] || '').trim();
  }

  print() {
    window.print();
  }
}
