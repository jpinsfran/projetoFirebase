import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  email: string ='';
  password: string = '';
  rememberMe: boolean = false;

  constructor (private router: Router) { }

  cadastrar () {
    this.router.navigate(['/cadastro']);
  }

}
