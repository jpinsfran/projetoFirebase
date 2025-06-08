import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { UserInterface } from '../interfaces/user-interface';
import { Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private auth: AngularFireAuth, private firestore: AngularFirestore, private router: Router) { }

  cadastro(name: string,email: string,password: string,confirmPassword: string){
    if(password!== confirmPassword){
      alert("As senhas não coincidem!");
      return;
    }

    this.auth.createUserWithEmailAndPassword(email,password).then(async userCredential =>{
      const user = userCredential.user;

      if(user){
        const userData: UserInterface = {
          nome: name,
          email: email,
          tipo: 'Usuário'
        }

        await this.salvarDados(user.uid,userData);
        user.sendEmailVerification();
        this.auth.signOut
      }
    })
    .catch(error=>{
      console.log(error);
    })
  }
  salvarDados(id: string, user: UserInterface){
    return this.firestore.collection('users').doc(id).set(user)

  }
  login(email: string, password: string){
    this.auth.signInWithEmailAndPassword(email,password).then((userCredential)=>{
      if(userCredential.user?.emailVerified){
        this.router.navigate(['/home']);
      }
    })
    .catch(error=>{
      console.log(error);
    })

  }
  redefinirSenha(email: string){
    this.auth.sendPasswordResetEmail(email).then(()=>{}).catch((error)=>{
      console.log(error)
    })
  }
  logout(){
    this.auth.signOut().then(()=>{
      this.router.navigate(['/'])
    }).catch((error)=>{
      console.log(error)
    })

  }
  getUserData(): Observable<any>{
    return this.auth.authState.pipe(switchMap(user=>{
      if(user){
        return this.firestore.collection('users').doc(user.uid).valueChanges()
      }else{
        return of(null)
      }
    }))
  }
}
