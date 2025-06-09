import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { DatabaseService } from '../../services/database.service';
import { MovieInterface } from '../../interfaces/movie-interface';
import {finalize} from 'rxjs';

@Component({
  selector: 'app-edit-movie',
  templateUrl: './edit-movie.component.html',
  styleUrl: './edit-movie.component.scss'
})
export class EditMovieComponent implements OnInit {

  @Input() movie!: MovieInterface;
  @Output() closeModal = new EventEmitter<void>();
  @Output() updated = new EventEmitter<MovieInterface>();

  editForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private storage: AngularFireStorage
  ) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      name: [this.movie.name, Validators.required],
      rating: [this.movie.rating, Validators.required],
      analysis: [this.movie.analysis, Validators.required]
    });
    this.previewUrl = this.movie.photo_path;
  }
  ngOnChanges() {
    this.editForm.patchValue(this.movie);
  }


  setRating(rating: number) {
    this.editForm.patchValue({ rating });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit() {
  if (this.editForm.valid) {
    const updatedMovie = { ...this.movie, ...this.editForm.value };
    this.updated.emit(updatedMovie);
  }
}


  saveUpdate(updatedData: any): void {
    if (this.selectedFile) {
      const filePath = `movies/${this.movie.id}_${Date.now()}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, this.selectedFile);

      task.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((url) => {
            updatedData.photo_path = url;

            this.databaseService.updateDocument('movies', this.movie.id, updatedData)
              .then(() => {
                console.log('Filme atualizado com nova imagem!');
                this.updated.emit({ ...this.movie, ...updatedData });
                this.closeModal.emit();
              })
              .catch((error) => {
                console.error('Erro ao atualizar filme com imagem:', error);
              });
          });
        })
      ).subscribe();
    } else {
      this.databaseService.updateDocument('movies', this.movie.id, updatedData)
        .then(() => {
          console.log('Filme atualizado com sucesso!');
          this.updated.emit({ ...this.movie, ...updatedData });
          this.closeModal.emit();
        })
        .catch((error) => {
          console.error('Erro ao atualizar filme:', error);
        });
    }
  }
  onClose() {
    this.closeModal.emit();
  }
}
