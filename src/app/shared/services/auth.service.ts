import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { UserInterface } from '../interfaces/user-interface';
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators'; // Certifique-se de importar 'map'
import firebase from 'firebase/compat/app'; // Necessário para firebase.auth.GoogleAuthProvider()
import 'firebase/compat/auth'; // Necessário para firebase.auth.GoogleAuthProvider()

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
      throw new Error("As senhas não coincidem!");
    }

    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
        const userData: UserInterface = {
          name: name,
          email: email,
          tipo: 'Usuário'
        };

        await this.salvarDados(user.uid, userData);
        await user.sendEmailVerification();
        alert('Cadastro realizado com sucesso! Um e-mail de verificação foi enviado. Por favor, verifique sua caixa de entrada.');
        await this.auth.signOut();
        this.router.navigate(['/login']);
      } else {
        throw new Error('Usuário não criado após cadastro.');
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
      throw error;
    }
  }

  /**
   * Salva os dados do usuário no Firestore.
   * @param id UID do usuário.
   * @param user Dados do usuário.
   * @returns Promise<void>
   */
  salvarDados(id: string, user: UserInterface): Promise<void> {
    return this.firestore.collection('users').doc(id).set(user, { merge: true });
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
          alert(`Bem-vindo, ${user.displayName || user.email}!`);
          this.router.navigate(['/home']);
        } else {
          alert('Por favor, verifique seu e-mail antes de fazer login. Um novo e-mail de verificação pode ter sido enviado.');
          await user.sendEmailVerification();
          await this.auth.signOut();
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
          case 'auth/invalid-credential':
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
      throw error;
    }
  }

  /**
   * Realiza o login com Google.
   * Salva os dados do usuário no Firestore se for o primeiro login.
   * @returns Promise<any> que resolve com o userCredential ou rejeita em erro.
   */
  async loginWithGoogle(): Promise<any> {
    // 1. Instanciar o provedor de autenticação do Google
    const provider = new firebase.auth.GoogleAuthProvider();

    // 2. Opcional: Definir parâmetros personalizados (útil para forçar seleção de conta)
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      // 3. Chamar o método signInWithPopup e aguardar o resultado
      const userCredential = await this.auth.signInWithPopup(provider);
      const user = userCredential.user; // O objeto user do Firebase Auth

      // 4. Verificar se o usuário foi obtido com sucesso
      if (user) {
        console.log('Login com Google bem-sucedido!', user.displayName, user.email, user.uid);

        // 5. Verificar se o e-mail do usuário está verificado
        // Para Google, o e-mail geralmente já vem verificado, mas é uma boa prática
        if (!user.emailVerified) {
          console.warn('E-mail do usuário Google não verificado. Enviando e-mail de verificação...');
          await user.sendEmailVerification();
          alert('Seu e-mail Google não está verificado. Um e-mail de verificação foi enviado. Por favor, verifique sua caixa de entrada.');
          await this.auth.signOut(); // Desloga o usuário se o e-mail não for verificado
          throw new Error('E-mail não verificado após login com Google.');
        }

        // 6. Preparar os dados do usuário para o Firestore
        const userData: UserInterface = {
          name: user.displayName || 'Sem Nome',
          email: user.email || '',
          tipo: 'Usuário' // Definir o tipo padrão para novos usuários do Google
        };

        // 7. Salvar/atualizar os dados do usuário no Firestore
        // { merge: true } é importante para não sobrescrever outros campos existentes
        await this.firestore.doc(`users/${user.uid}`).set(userData, { merge: true });
        console.log('Dados do usuário Google salvos/atualizados no Firestore.');

        // 8. Feedback de sucesso e navegação
        alert(`Bem-vindo, ${user.displayName || user.email}!`);
        this.router.navigate(['/home']);

        // 9. Retornar o userCredential (opcional, mas pode ser útil para o componente)
        return userCredential;
      } else {
        // Se userCredential.user for nulo por algum motivo
        throw new Error('Não foi possível obter os dados do usuário após o login com Google.');
      }

    } catch (error: any) {
      // 10. Tratamento de erros robusto
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
          case 'auth/unauthorized-domain': // Este é o erro comum que pode estar disfarçado
            errorMessage = 'Domínio não autorizado. Verifique as configurações de domínio no Firebase Console.';
            break;
          default:
            errorMessage = `Erro de autenticação Google: ${error.message}`;
        }
      }
      alert(errorMessage);
      throw error; // Propagar o erro para o componente
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
      throw error;
    }
  }

  /**
   * Realiza o logout do usuário.
   * @returns Promise<void> que resolve em sucesso ou rejeita em erro.
   */
  async logout(): Promise<void> {
    try {
      await this.auth.signOut();
      alert('Você foi desconectado com sucesso.');
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      alert(`Erro ao fazer logout: ${error.message}`);
      throw error;
    }
  }

  /**
   * Observa o estado de autenticação do usuário e busca seus dados no Firestore.
   * Retorna os dados do UserInterface do Firestore, ou null se não houver usuário logado
   * ou se o documento do usuário não existir no Firestore.
   * @returns Observable de UserInterface ou null.
   */
  getUserData(): Observable<UserInterface | null> {
    return this.auth.authState.pipe(
      switchMap(user => {
        if (user && user.uid) {
          return this.firestore.collection<UserInterface>('users').doc(user.uid).valueChanges().pipe(
            map(firestoreUser => firestoreUser || null)
          );
        } else {
          return of(null);
        }
      })
    );
  }

  /**
   * Retorna o usuário logado atualmente (síncrono).
   * Útil para verificar rapidamente se há um usuário.
   * @returns firebase.User | null
   */
  getCurrentUser(): Promise<firebase.User | null> {
    return this.auth.currentUser;
  }
}