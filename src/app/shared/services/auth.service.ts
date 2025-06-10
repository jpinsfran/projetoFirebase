// src/app/shared/services/auth.service.ts
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { UserInterface } from '../interfaces/user-interface'; // Certifique-se que o caminho está correto
import { Observable, of } from 'rxjs'; // 'of' é usado se o user for null
import { switchMap } from 'rxjs/operators';
import firebase from 'firebase/compat/app'; // Necessário para GoogleAuthProvider
import 'firebase/compat/auth'; // Necessário para GoogleAuthProvider

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private auth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) { }

  /**
   * Realiza o cadastro de um novo usuário com e-mail e senha.
   * Envia e-mail de verificação após o cadastro.
   * @param name Nome do usuário.
   * @param email E-mail do usuário.
   * @param password Senha do usuário.
   * @param confirmPassword Confirmação da senha.
   * @returns Promise<void> que resolve em sucesso ou rejeita em erro.
   */
  async cadastro(name: string, email: string, password: string, confirmPassword: string): Promise<void> {
    if (password !== confirmPassword) {
      alert("As senhas não coincidem!");
      throw new Error("As senhas não coincidem!"); // Lança um erro para que o catch seja acionado no componente
    }

    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
        const userData: UserInterface = {
          name: name,
          email: email,
          tipo: 'Usuário' // Padronizado para 'Usuário' (com U maiúsculo)
        };

        await this.salvarDados(user.uid, userData);
        await user.sendEmailVerification(); // Agora usa await para garantir que o e-mail seja enviado
        alert('Cadastro realizado com sucesso! Um e-mail de verificação foi enviado. Por favor, verifique sua caixa de entrada.');
        await this.auth.signOut(); // Usa await para garantir o logout
        this.router.navigate(['/login']); // Redireciona para o login após cadastro e envio de verificação
      } else {
        throw new Error('Usuário não criado após cadastro.'); // Caso userCredential.user seja nulo inesperadamente
      }
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      let errorMessage = 'Erro ao cadastrar. Por favor, tente novamente.';
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Este e-mail já está em uso. Tente outro ou faça login.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'O formato do e-mail é inválido.';
            break;
          case 'auth/weak-password':
            errorMessage = 'A senha é muito fraca. Ela deve ter pelo menos 6 caracteres.';
            break;
          default:
            errorMessage = `Erro no cadastro: ${error.message}`;
        }
      }
      alert(errorMessage);
      throw error; // Propaga o erro para o componente
    }
  }

  /**
   * Salva os dados do usuário no Firestore.
   * @param id UID do usuário.
   * @param user Dados do usuário.
   * @returns Promise<void>
   */
  salvarDados(id: string, user: UserInterface): Promise<void> {
    return this.firestore.collection('users').doc(id).set(user, { merge: true }); // Usar merge: true para não sobrescrever outros campos
  }

  /**
   * Realiza o login com e-mail e senha.
   * Verifica se o e-mail do usuário está verificado.
   * @param email E-mail do usuário.
   * @param password Senha do usuário.
   * @returns Promise<void> que resolve em sucesso ou rejeita em erro.
   */
  async login(email: string, password: string): Promise<void> {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
        if (user.emailVerified) {
          alert(`Bem-vindo, ${user.displayName || user.email}!`); // Feedback de sucesso
          this.router.navigate(['/home']);
        } else {
          alert('Por favor, verifique seu e-mail antes de fazer login. Um novo e-mail de verificação pode ter sido enviado.');
          await user.sendEmailVerification(); // Reenvia o e-mail de verificação caso o usuário tente logar sem verificar
          await this.auth.signOut(); // Desloga o usuário se o e-mail não for verificado
        }
      } else {
        throw new Error('Não foi possível obter os dados do usuário após o login.');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      let errorMessage = 'Erro ao fazer login. Verifique seu e-mail e senha.';
      if (error.code) {
        switch (error.code) {
          case 'auth/wrong-password':
          case 'auth/user-not-found':
          case 'auth/invalid-credential': // Novo código de erro comum em versões mais recentes do Firebase
            errorMessage = 'E-mail ou senha incorretos.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'O formato do e-mail é inválido.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Sua conta foi desativada. Entre em contato com o suporte.';
            break;
          default:
            errorMessage = `Erro no login: ${error.message}`;
        }
      }
      alert(errorMessage);
      throw error; // Propaga o erro para o componente
    }
  }

  /**
   * Realiza o login com Google.
   * Salva os dados do usuário no Firestore se for o primeiro login.
   * @returns Promise<any> que resolve com o userCredential ou rejeita em erro.
   */
  async loginWithGoogle(): Promise<any> {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' }); // Força a seleção de conta, útil para multi-contas

    try {
      const userCredential = await this.auth.signInWithPopup(provider);
      const user = userCredential.user;

      if (user) {
        console.log('Login com Google bem-sucedido!', user.displayName, user.email, user.uid);

        // Verifique se o e-mail está verificado (o Google já verifica o e-mail, mas o Firebase pode ter um flag)
        // Normalmente, o e-mail vindo do Google já é considerado verificado pelo Firebase.
        if (!user.emailVerified) {
          await user.sendEmailVerification(); // Envia e-mail de verificação se não for verificado (raro para Google)
          alert('Seu e-mail pode não estar verificado. Um e-mail de verificação foi enviado. Por favor, verifique sua caixa de entrada.');
          await this.auth.signOut(); // Desloga se não verificado para forçar a verificação (opcional)
          throw new Error('E-mail não verificado.'); // Lança erro para interromper o fluxo
        }

        const userData: UserInterface = {
          name: user.displayName || 'Sem Nome',
          email: user.email || '',
          tipo: 'Usuário' // Padronizado para 'Usuário'
        };

        // Salva/atualiza os dados do usuário no Firestore. Usa merge: true para não sobrescrever outros campos.
        await this.firestore.doc(`users/${user.uid}`).set(userData, { merge: true });
        console.log('Dados do usuário Google salvos/atualizados no Firestore.');

        alert(`Bem-vindo, ${user.displayName || user.email}!`); // Feedback de sucesso
        this.router.navigate(['/home']);
        return userCredential; // Retorna o userCredential
      } else {
        throw new Error('Não foi possível obter os dados do usuário após o login com Google.');
      }
    } catch (error: any) {
      console.error('Erro ao fazer login com Google:', error);
      let errorMessage = 'Erro ao fazer login com Google. Por favor, tente novamente.';

      if (error.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = 'O pop-up de login foi fechado. Por favor, tente novamente.';
            break;
          case 'auth/cancelled-popup-request':
            errorMessage = 'A requisição de pop-up foi cancelada. Um pop-up já está aberto ou foi bloqueado.';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'O pop-up de login foi bloqueado pelo seu navegador. Por favor, permita pop-ups para este site.';
            break;
          case 'auth/account-exists-with-different-credential':
            errorMessage = 'Uma conta com este e-mail já existe com outro método de login (e-mail/senha, Facebook, etc.). Use o método original ou vincule as contas.';
            break;
          default:
            errorMessage = `Erro no login com Google: ${error.message}`;
        }
      }
      alert(errorMessage);
      throw error; // Propaga o erro
    }
  }

  /**
   * Redefine a senha do usuário enviando um e-mail de redefinição.
   * @param email E-mail do usuário para redefinição.
   * @returns Promise<void> que resolve em sucesso ou rejeita em erro.
   */
  async redefinirSenha(email: string): Promise<void> {
    try {
      await this.auth.sendPasswordResetEmail(email);
      alert('E-mail de redefinição de senha enviado. Verifique sua caixa de entrada.');
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      let errorMessage = 'Erro ao redefinir senha. Verifique o e-mail informado.';
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage = 'O formato do e-mail é inválido.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'Nenhuma conta encontrada com este e-mail.';
            break;
          default:
            errorMessage = `Erro ao redefinir senha: ${error.message}`;
        }
      }
      alert(errorMessage);
      throw error; // Propaga o erro
    }
  }

  /**
   * Realiza o logout do usuário.
   * @returns Promise<void> que resolve em sucesso ou rejeita em erro.
   */
  async logout(): Promise<void> {
    try {
      await this.auth.signOut();
      alert('Você foi desconectado com sucesso.'); // Feedback de sucesso
      this.router.navigate(['/login']); // Redireciona para a página de login
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      alert(`Erro ao fazer logout: ${error.message}`);
      throw error; // Propaga o erro
    }
  }

  /**
   * Observa o estado de autenticação do usuário e busca seus dados no Firestore.
   * @returns Observable de UserInterface ou null se não houver usuário logado.
   */
  getUserData(): Observable <any> {
    return this.auth.authState.pipe(
      switchMap(user => {
        if (user && user.uid) { // Verifica se há um usuário e UID
          return this.firestore.collection<UserInterface>('users').doc(user.uid).valueChanges();
        } else {
          return of(null); // Retorna um observable de null se não houver usuário
        }
      })
    );
  }

  /**
   * Retorna o usuário logado atualmente (síncrono).
   * Útil para verificar rapidamente se há um usuário.
   * @returns firebase.User | null
   */
  getCurrentUser(): any {
    return this.auth.currentUser;
  }
}