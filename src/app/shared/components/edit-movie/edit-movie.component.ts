// src/app/shared/components/edit-movie/edit-movie.component.ts

import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core'; // Adicione OnDestroy
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { DatabaseService } from '../../services/database.service';
import { MovieInterface } from '../../interfaces/movie-interface';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs'; // Importe Subscription

@Component({
  selector: 'app-edit-movie',
  templateUrl: './edit-movie.component.html',
  styleUrl: './edit-movie.component.scss'
})
export class EditMovieComponent implements OnInit, OnDestroy { // Implemente OnDestroy

  @Input() movie!: MovieInterface;
  @Output() closeModal = new EventEmitter<void>();
  @Output() updated = new EventEmitter<MovieInterface>();

  editForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  // AQUI: Alterado para aceitar 'undefined' também
  uploadProgress: number | undefined | null = null;
  uploadTaskSubscription: Subscription | null = null;

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
    if (this.movie && this.editForm) {
      this.editForm.patchValue(this.movie);
      this.previewUrl = this.movie.photo_path;
    }
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
    } else {
      this.previewUrl = this.movie.photo_path;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.editForm.invalid) {
      console.error('Formulário inválido.');
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const updatedData = { ...this.movie, ...this.editForm.value };

    try {
      if (this.selectedFile) {
        const filePath = `movies/${this.movie.id}_${this.selectedFile.name}_${Date.now()}`;
        const fileRef = this.storage.ref(filePath);
        const task = this.storage.upload(filePath, this.selectedFile);

        this.uploadTaskSubscription = task.percentageChanges().subscribe(progress => {
          this.uploadProgress = progress; // Agora, 'progress' (number | undefined) pode ser atribuído a 'uploadProgress'
        });

        const snapshot = await task.snapshotChanges().pipe(finalize(async () => {
            if (this.uploadTaskSubscription) {
                this.uploadTaskSubscription.unsubscribe();
                this.uploadTaskSubscription = null; // Limpa a subscrição após a finalização
            }
        })).toPromise();

        const downloadURL = await fileRef.getDownloadURL().toPromise();
        updatedData.photo_path = downloadURL;

        if (this.movie.photo_path && this.movie.photo_path !== downloadURL) {
            try {
                await this.databaseService.deleteImageByUrl(this.movie.photo_path);
                console.log('Imagem antiga deletada do Storage:', this.movie.photo_path);
            } catch (deleteError) {
                console.warn('Não foi possível deletar a imagem antiga (pode não existir ou ter permissão):', deleteError);
            }
        }
      }

      await this.databaseService.updateDocument('movies', this.movie.id, updatedData);
      console.log('Filme atualizado com sucesso!');
      this.updated.emit(updatedData);
      this.closeModal.emit();
    } catch (error) {
      console.error('Erro ao atualizar filme:', error);
      alert('Erro ao atualizar filme. Por favor, tente novamente.');
    } finally {
        this.uploadProgress = null; // Reseta o progresso para null ao final
    }
  }

  // Novo método para desinscrever ao destruir o componente
  ngOnDestroy(): void {
    if (this.uploadTaskSubscription) {
      this.uploadTaskSubscription.unsubscribe();
    }
  }

  onClose() {
    this.closeModal.emit();
  }
}