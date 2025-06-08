import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  email: string ='';
  password: string = '';
  rememberMe: boolean = false;

  constructor (private router: Router, private auth:AuthService) { }

  cadastrar () {
    this.router.navigate(['/cadastro']);
  }

  login(){
    if(this.email !=='' && this.password !==''){
      this.auth.login(this.email,this.password)
    }else{
      alert('Preencha todos os dados!')
    }
  }

}
