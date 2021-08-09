import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from 'src/services/auth.service';

import { onAuthUIStateChange, CognitoUserInterface, AuthState, FormFieldTypes } from '@aws-amplify/ui-components';
import { API, Auth } from 'aws-amplify';
import { LiveStreamService } from 'src/services/liveStream.service';
import { LodStream } from 'src/models/lodStream.model';
import { LodStreamChatMsg } from 'src/models/lodStreamChatMsg.model';
import { DataCompaniesService } from 'src/services/data.companies.service';
import { LodCompany } from 'src/models/lodCompany.model';
import { LodEvent } from 'src/models/lodEvent.model';
import { DataEventsService } from 'src/services/data.events.service';

@Component({
  selector: 'app-empresas',
  templateUrl: './app-empresas.component.html'
})
export class AppEmpresasComponent implements OnInit {

  flagPageLoading = true;

  // cadastro, evento, home
  _subModule: string;

  company: LodCompany;

  event: LodEvent;

  get subModule(): string {

    if (!this._subModule || this._subModule == '') {

      if (this.appAuth.userIsLogged) {

        // when logged, /companyId/ is home
        this._subModule = 'home';

      } else {

        // when not logged, /companyId/ is auto-cadastro
        // when NOT beckman
        if (this.appAuth.clientKey == 'beckman') {

          this._subModule = 'login';

        } else if (this.appAuth.clientKey == 'catho') {

          this._subModule = 'cadastroCatho';

        } else {

          this._subModule = 'cadastro'
        }
      }
    }

    return this._subModule;
  }

  set subModule(val: string) {

    this._subModule = val;
  }

  constructor(
    private ref: ChangeDetectorRef,
    public appAuth: AuthService,
    private appDataCompanies: DataCompaniesService,
    private appDataEvents: DataEventsService,
    private router: Router,
    private appLive: LiveStreamService ) {

    this.router.events.subscribe((event) => {

      //console.log('navEvent>', event);

      if (event instanceof NavigationEnd) {

        this.checkNav();

      } else {

        //console.log('navigate  evt:', event);
      }
    });
  }

  async checkNav() {

    let url = document.location.pathname.toLowerCase();

    if (url[0] == '/') url = url.substr(1);

    let modules = url.split('/');

    let companyId = '';

    let currentHost = document.location.hostname.toLowerCase().replace('.lod.com.vc', '');
    let currentSubModule = '';

    if (currentHost != '') {

      // new way, where it's companyId.lod.com/eventId
      companyId = currentHost;

      if (companyId == 'localhost') companyId = 'catho';

      currentSubModule = modules[0];

      this.appAuth.flagUsingSubdomain = true;

    } else  {

      // old way, where it was lod.com/companyId/eventId
      companyId = modules[0];
      currentSubModule = modules[1];
    }

    this.appAuth.clientKey = companyId;

    this.company = await this.appDataCompanies.getCompanyDetails(companyId);

    console.log('checkNav() app-empresas ' + companyId + ' user? '+ this.appAuth.userIsLogged + ' currentSubModule: ' + currentSubModule, this.company);

    if (currentSubModule == ''
    || currentSubModule == 'home'
    || currentSubModule == 'login'
    || currentSubModule == 'cadastro'
    || currentSubModule == 'cadastroCatho') {

      this.subModule = currentSubModule;

      if (currentSubModule == '' || currentSubModule == 'home') {

        if (this.appAuth.userIsLogged) {

          // when logged, company home is home
          this.subModule = 'home';

        } else {

          // when not logged, /companyId/ is auto-cadastro
          // when NOT beckman
          if (this.appAuth.clientKey == 'beckman') {

            this._subModule = 'login';

          } else if (this.appAuth.clientKey == 'catho'){

            this._subModule = 'cadastroCatho';

          } else {

            this._subModule = 'cadastro';
          }
        }
      }

    } else {

      // veio o eventId como parametro depois de companyId

      if (this.appAuth.userIsLogged) {

        // when logged, event home is here
        this.subModule = 'evento';

        let evt:any = await this.appDataEvents.getEventDetails(companyId, currentSubModule);

        if (!evt.error) {

          this.appAuth.eventKey = currentSubModule;
          this.event = new LodEvent(evt);

        } else {

          console.log('Error getting event: ', evt);
        }

      } else {

        // when not logged, /companyId/ is auto-cadastro
        // when NOT beckman
        if (this.appAuth.clientKey == 'beckman') {

          this._subModule = 'login';

        } else if (this.appAuth.clientKey == 'catho') {

          this._subModule = 'cadastroCatho';

        } else {

         this._subModule = 'cadastro';

        }
      }

    }

    // /companyId/logout redirects to logout
    if (this.subModule == 'logout') {

      await Auth.signOut();

      await this.appAuth.logout();

      document.location.href = '/';

      return;
    }

    window.setTimeout(() => {

      this.flagPageLoading = false;

    }, 1042);
  }

  async ngOnInit() {

    console.log('onInit() companies');

    await this.checkNav();

    onAuthUIStateChange((authState, authData) => {

      this.ref.detectChanges();

      this.checkNav();
    });
  }
}
