import { Injectable } from '@angular/core';

import { CognitoUserInterface,  AuthState } from '@aws-amplify/ui-components';
import { Auth } from 'aws-amplify';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  flagUserChecked = false;

  private _user : CognitoUserInterface = null;

  get userId(): string {

    if (this.user && this.user.attributes != null && this.user.attributes.sub) {

      return this.user.attributes.sub;
    }

    return '';
  }

  get user(): CognitoUserInterface {

    return this._user;
  }

  get userAlias(): string {

    if (this.user && this.user.attributes != null && this.user.attributes.name) {

      let alias = this.user.attributes.name.split(' ')[0].toLowerCase();

      return alias[0].toUpperCase() + alias.substring(1);
    }

    if (this.user && this.user.attributes != null && this.user.attributes['cognito:username']) {

      let alias = this.user.attributes['cognito:username'].split('@')[0].toLowerCase();

      return alias[0].toUpperCase() + alias.substring(1);
    }

    if (this.user && this.user.username != null && this.user.username != '') {

      let alias = this.user.username.split('@')[0].toLowerCase();

      return alias[0].toUpperCase() + alias.substring(1);
    }

    return '';
  }

  set user(val: CognitoUserInterface) {

    this._user = val;
  }

  get userIsLogged() {
    return this._user != null;
  }

  get userIsLod() {

    return (this._user && this._user.attributes && this._user.attributes.profile.indexOf('lod-') == 0);
  }

  eventKey = '';

  private _clientKey = 'lod';

  get clientKey() {

    if (!this._clientKey || this._clientKey == '') {
      this._clientKey = 'lod';
    }

    return this._clientKey;
  }

  get clientKeyAsName() {


    return this._clientKey.substr(0, 1).toUpperCase() + this._clientKey.substr(1).toLowerCase();
  }

  set clientKey(val: string) {

    this._clientKey = val;

    console.log('SET clientKey ' + val);

    let paths = document.location.pathname.toLowerCase().substr(1).split('/');

    let cl = `body-${ this._clientKey } submodule-${ paths[1] }`;

    document.body.setAttribute('class', cl);
  }

  flagUsingSubdomain = false;

  get routePrefix() {

    // this is for when we need root to be lod.com.vc/clientId
    return this.flagUsingSubdomain ? '' : this.clientKey;
  }

  constructor() {

  }

  async loadUser() {

    return new Promise((resolve, reject) => {

      let currentUrl = document.location.toString().toLowerCase();

      let currentHost = document.location.hostname.toLowerCase().replace('lod.com.vc', '');

      if (currentHost && currentHost[currentHost.length -1] == '.')
        currentHost = currentHost.substr(0, currentHost.length -1)

      let paths = document.location.pathname.substr(1).split('/');

      if (currentHost != '') {
  
        currentHost = currentHost.replace('localhost', 'catho');
        
        // estamos no subdominio do cliente      
        this.clientKey = currentHost;

        if (paths.length > 0 && !['', 'home', 'cadastro', 'login', 'logout'].includes(paths[0])) {

          //the second element is the eventId then
          this.eventKey = paths[0];
        }
      }

      if (currentUrl.includes('logout')) {

        try {

          Auth.signOut();

          this.logout();

        } catch(err){}

        document.location.pathname = '/';
      }

      Auth.currentAuthenticatedUser().then((userData) => {

        this.flagUserChecked = true;

        if (userData) {

          this.user = userData;

          this.clientKey = this.user.attributes['custom:companyId'];

          resolve(true);

        } else {

          resolve(false);
        }

        resolve(false);

      }, (notLoaded) => {

        this.flagUserChecked = true;
        this.user = null;

      });

    });
  }

  logUser(user) {

    this.user = user;

    //TODO: Should this always superseed the subdomain, for instance?
    this.clientKey = this.user.attributes['custom:companyId'];

    //window.clearInterval(this.loginMsgTranslationInterval);
  }

  logout() {

    if (this.user && this.user.logout) {

      this.user.logout();
    }

    this.user = null;
  }
}
