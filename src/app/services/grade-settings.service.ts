import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { serverTimestamp, setDoc } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { GradeSettings } from '../shared/models';
import { LoadingService } from './loading.service';

const GRADES_COLLECTION = 'grades';

@Injectable({ providedIn: 'root' })
export class GradeSettingsService {
  private readonly db = inject(Firestore);
  private readonly loading = inject(LoadingService);

  get$(gradeId: string): Observable<GradeSettings | undefined> {
    const ref = doc(this.db, GRADES_COLLECTION, gradeId);
    return docData(ref, { idField: 'id' }) as Observable<GradeSettings | undefined>;
  }

  async save(
    gradeId: string,
    data: Pick<
      GradeSettings,
      'hardCoverPrintOut' | 'hardCoverPrintOutPage2' | 'homeLanguagePrintOut'
    >,
  ): Promise<void> {
    this.loading.begin();
    try {
      const ref = doc(this.db, GRADES_COLLECTION, gradeId);
      await setDoc(ref, { ...data, id: gradeId, updatedAt: serverTimestamp() }, { merge: true });
    } finally {
      this.loading.end();
    }
  }
}
