import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recuperar-senha',
  templateUrl: './recuperar-senha.component.html',
  styleUrl: './recuperar-senha.component.scss'
})
export class RecuperarSenhaComponent {

  email : string = '';
  modalVerification : boolean = false;

  constructor (private router: Router) {}

  openModal() {
    this.modalVerification=true;
  }

  closeModal() {
    this.modalVerification=false;
    this.router.navigate(['/login']);
  }

}
