import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from 'src/services/auth.service';

import { onAuthUIStateChange, CognitoUserInterface, AuthState, FormFieldTypes } from '@aws-amplify/ui-components';
import { API, Auth } from 'aws-amplify';
import { LiveStreamService } from 'src/services/liveStream.service';
import { LodStream } from 'src/models/lodStream.model';
import { LodStreamChatMsg } from 'src/models/lodStreamChatMsg.model';
import { DataCompaniesService } from 'src/services/data.companies.service';
import { LodCompany } from 'src/models/lodCompany.model';

@Component({
  selector: 'app-emp-login',
  templateUrl: './app-emp-login.component.html'
})
export class AppEmpLoginComponent implements OnInit {

  get companyName() {

    return '';
  }

  constructor(
    private ref: ChangeDetectorRef,
    public appAuth: AuthService,
    private appDataCompanies: DataCompaniesService,
    private router: Router,
    private appLive: LiveStreamService ) {

      /*
    this.router.events.subscribe((event) => {

      console.log('navEvent>', event);

      if (event instanceof NavigationEnd) {

      } else {

      }
    });
    */
  }

  async ngOnInit() {

    onAuthUIStateChange((authState, authData) => {

      this.ref.detectChanges();

      if (authState == 'signedin') {

        //we logged in, go to company home
        document.location.href = '/' + this.appAuth.routePrefix;
      }
    });
  }
}