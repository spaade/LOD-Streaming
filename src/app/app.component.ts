
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import { onAuthUIStateChange, CognitoUserInterface, AuthState, FormFieldTypes } from '@aws-amplify/ui-components';
import { Auth } from 'aws-amplify';
import { AuthService } from 'src/services/auth.service';

import { I18n } from 'aws-amplify';

import { DataCompaniesService } from 'src/services/data.companies.service';
import { PrimeNGConfig } from 'primeng/api';
import {HttpHeaders} from '@angular/common/http';


const authScreenLabels = {
  pt: {
      'Sign Up': 'Criar uma nova conta',
      'Sign Up Account': 'Criar uma nova conta',
      'Sign in to your account': 'Fazer login',
      'Username *': 'Usuário/Email *',
      'Password *': 'Senha *',
      'Sign In': 'FAZER LOGIN',
      'Enter your username': 'Seu nome de usuário ou email',
      'Enter your password': 'Sua senha',
      'Forgot your password?': 'Esqueceu a senha?',
      'Reset password': 'Resetar Senha'
  },
  es: {
    'Sign Up': 'Crea una cuenta nueva',
    'Sign Up Account': 'Crea una cuenta nueva',
    'Sign in to your account': 'Hacer login',
    'Username *': 'Usuario/Email *',
    'Password *': 'Contraseña *',
    'Sign In': 'HACER LOGIN',
    'Enter your username': 'Su nombre de usuario o email',
    'Enter your password': 'Su contraseña',
    'Forgot your password?': 'olvido la contraseña?',
    'Reset password': 'Restablecer la contraseña'
  }
};

I18n.setLanguage('pt');
I18n.putVocabularies(authScreenLabels);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

  private zone: NgZone;

  formFields = [
    { type: "username" },
    { type: "password", hint: null }
  ];

  get flagUserChecked() {

    return this.appAuth.flagUserChecked;
  }

  constructor(
    private ref: ChangeDetectorRef,
    private router: Router,
    private appDataCompanies: DataCompaniesService,
    public appAuth: AuthService,
    private primengConfig: PrimeNGConfig,
    private activatedRoute: ActivatedRoute) {
  }

  redirectUser() {

    if (document.location.pathname == '/') {

      if (this.appAuth.userIsLod) {

        document.location.pathname = '/admin/clientes';

      }
    }
  }

  /*
  handleAuthStateChanged(authState, authData) {

    console.log('auth: ' + authState);

    if (authState == 'signin' || authState == 'signedout') {

      this.appAuth.logout();
    }

    if (authState == 'signedin') {

      if (this.appAuth.user == null) {

        this.appAuth.logUser(authData as CognitoUserInterface);

        this.redirectUser();
      }
    }
  }
  */

  async ngOnInit() {

    this.appAuth.loadUser().then((userLoaded) => {

      console.log('User loaded? ' + userLoaded, this.appAuth.user);

      document.title = this.appAuth.clientKeyAsName;

      this.redirectUser();

    }, (userErr) => {

      console.log('User not loaded: ' + userErr, this.appAuth.user);

    });

    /*
    onAuthUIStateChange((authState, authData) => {

      console.log('onAuthUIStateChange: ' + authState);

      this.handleAuthStateChanged(authState, authData);

      this.ref.detectChanges();
    });
    */

    this.primengConfig.ripple = true;
  }
}
