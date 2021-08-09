
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { onAuthUIStateChange } from '@aws-amplify/ui-components';
import { Auth } from 'aws-amplify';
import { AuthService } from 'src/services/auth.service';

import { I18n } from 'aws-amplify';
import { AmplifyAuthenticator } from '@aws-amplify/ui-angular';

import { DataCompaniesService } from 'src/services/data.companies.service';

import { defaultLodTheme } from 'src/app/app.amplify.theme';

const authScreenLabels = {
  pt: {
      'Sign Up': 'Criar uma nova conta',
      'Sign Up Account': 'Criar uma nova conta',
      'Sign in to your account': 'Fazer login',
      'Username *': 'Usuário *',
      'Password *': 'Senha *',
      'Sign In': 'FAZER LOGIN',
      'Enter your username': 'Seu nome de usuário',
      'Enter your password': 'Sua senha',
      'Forgot your password?': 'Esqueceu a senha?',
      'Reset password': 'Resetar Senha',
      'UserMigration failed with error': 'Falha de Login'
  }
};

I18n.setLanguage('pt');
I18n.putVocabularies(authScreenLabels);

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {

  get theme() {
    return defaultLodTheme;
  }

  authState = 'signin';

  formFields = [
    { type: "username" },
    { type: "password", hint: null }
  ];
  
  constructor(
    private ref: ChangeDetectorRef,
    private router: Router,
    private appDataCompanies: DataCompaniesService,
    public appAuth: AuthService){}
  

  async ngOnInit() {

    onAuthUIStateChange((authState, authData) => {

      this.authState = authState;

      this.ref.detectChanges();

    });
  }
}
