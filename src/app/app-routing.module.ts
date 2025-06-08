import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { CadastroComponent } from './components/cadastro/cadastro.component';
import { RecuperarSenhaComponent } from './components/recuperar-senha/recuperar-senha.component';
import { HomeComponent } from './components/home/home.component';

const routes: Routes = [
  {
    path: '', component: LoginComponent,
  },
  {
    path: 'cadastro', component: CadastroComponent,
  },
  {
    path: 'recuperar-senha', component: RecuperarSenhaComponent,
  },
  {
    path: 'home', component: HomeComponent,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
