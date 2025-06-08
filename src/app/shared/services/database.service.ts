import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { UserInterface } from '../interfaces/user-interface';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { compilePipeFromMetadata } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(private db: AngularFirestore, private storage: AngularFireStorage) { }

  addDocument(collection: string, data: any): Promise<any>{
    return this.db.collection(collection).add(data);
  }

  getDocument(collection: string, id: string): Observable<any | undefined>{
    return this.db.collection(collection).doc(id).valueChanges();
  }

  getCollection(collection: string): Observable <any[]>{
    return this.db.collection(collection).valueChanges({idField: 'id'})
  }

  getCollectionWithFilter(collection: string, field: string, value: string): Observable <any[]>{
    return this.db.collection(collection, ref => ref.where(field, '==', value)).valueChanges({idField: 'id'});
  }

  updateDocument(collection: string, id: string, data: any): Promise<any>{
    return this.db.collection(collection).doc(id).update(data);
  }

  deleteDocument(collection: string, id: string): Promise<void>{
    return this.db.collection(collection).doc(id).delete();
  }

  uploadImage(file: File, path: string): Observable<string> {
    const filePath = `${path}/${Date.now()}_${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    return new Observable(observer => {
      task.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe(downloadURL => {
            observer.next(downloadURL);
            observer.complete();
          }, error => observer.error(error));
        })
      ).subscribe();
    });
  }
}
