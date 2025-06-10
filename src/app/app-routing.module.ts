import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { CadastroComponent } from './components/cadastro/cadastro.component';
import { RecuperarSenhaComponent } from './components/recuperar-senha/recuperar-senha.component';
import { HomeComponent } from './components/home/home.component';
import { AuthGuard } from './shared/guards/auth.guard'; // Importe o AuthGuard


const routes: Routes = [
  { 
    path: '', redirectTo: '/login', pathMatch: 'full' 
  },
  {
    path: 'login', component: LoginComponent,
  },
  {
    path: 'cadastro', component: CadastroComponent,
  },
  {
    path: 'recuperar-senha', component: RecuperarSenhaComponent,
  },
  { 
    path: 'home', component: HomeComponent, canActivate: [AuthGuard] 
  }, // Protegida
  { 
    path: '**', redirectTo: '/login' 
  } // Rota curinga para qualquer URL não encontrada, redireciona para o login
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
