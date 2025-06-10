// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth'; // Importe AngularFireAuth
import firebase from 'firebase/compat/app'; // Necessário para tipagem User
import 'firebase/compat/auth'; // Necessário para tipagem User

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  // Injetamos o AngularFireAuth diretamente aqui
  // ou podemos ter um método no AuthService que retorne this.auth.authState
  constructor(private afAuth: AngularFireAuth, private router: Router) {} // Renomeado para afAuth para clareza

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Observa o estado de autenticação do Firebase
    return this.afAuth.authState.pipe( // Usamos afAuth.authState diretamente
      take(1), // Pega apenas o estado atual e completa
      map((user: firebase.User | null) => { // Tipamos 'user' como firebase.User | null
        if (user && user.emailVerified) {
          // Usuário logado e e-mail verificado, permite o acesso
          return true;
        } else if (user && !user.emailVerified) {
          // Usuário logado, mas e-mail NÃO verificado
          alert('Por favor, verifique seu e-mail para acessar esta área.');
          // Opcional: você pode optar por não deslogar aqui, ou deslogar para forçar a verificação.
          // Se você deslogar aqui, o usuário precisará logar novamente após verificar.
          // Se não deslogar, ele permanece logado mas não consegue acessar rotas protegidas por este guard.
          // this.afAuth.signOut(); // Se quiser forçar o logout
          return this.router.createUrlTree(['/login']); // Redireciona para a página de login
        } else {
          // Usuário não logado
          alert('Você precisa estar logado para acessar esta página.');
          return this.router.createUrlTree(['/login']); // Redireciona para a página de login
        }
      })
    );
  }
}