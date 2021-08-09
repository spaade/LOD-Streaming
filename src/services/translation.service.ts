import { Injectable } from '@angular/core';

import { CognitoUserInterface,  AuthState } from '@aws-amplify/ui-components';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  flagTranslated = false;

  translate() {
    
    let el = document.querySelector('.form-section-header .header');

    if (el) { //Sign in to your account
      el.innerHTML = 'Login';
    }

    el = document.querySelector('.form-section-header .header');

    if (el) { //Sign in to your account
      el.innerHTML = 'Login';
    }
  }
}