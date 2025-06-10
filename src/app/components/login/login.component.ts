// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service'; // OK

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  email: string ='';
  password: string = '';
  rememberMe: boolean = false;

  constructor (private router: Router, private auth:AuthService) { } // OK

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

  // Função para chamar o login com Google
  loginWithGoogle() {
    this.auth.loginWithGoogle().catch(error => { // Adicione .catch para lidar com erros aqui também
      console.error('Erro no componente ao tentar login com Google:', error);
      // O alert já será exibido no service, mas você pode adicionar lógica extra aqui se precisar
    });
  }
}