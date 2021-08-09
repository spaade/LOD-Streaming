import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import { AuthService } from 'src/services/auth.service';

import { onAuthUIStateChange, CognitoUserInterface, AuthState, FormFieldTypes } from '@aws-amplify/ui-components';
import { API, Auth } from 'aws-amplify';
import { LiveStreamService } from 'src/services/liveStream.service';
import { LodStream } from 'src/models/lodStream.model';
import { LodStreamChatMsg } from 'src/models/lodStreamChatMsg.model';
import { DataCompaniesService } from 'src/services/data.companies.service';
import { LodCompany } from 'src/models/lodCompany.model';
import {DataEventsService} from '../../../services/data.events.service';
import { DomSanitizer } from '@angular/platform-browser'

@Component({
  selector: 'app-emp-home',
  templateUrl: './app-emp-home.component.html'
})
export class AppEmpHomeComponent implements OnInit {

  flagLoading = true;

  companyDetails;

  streamUrl;

  get company(): any {

    return (this.companyDetails && this.companyDetails.company) ? this.companyDetails.company : { companyName: 'Empresa' };
  }

  get events(): any {

    return (this.companyDetails && this.companyDetails.events) ? this.companyDetails.events : [];
  }

  get routePrefix(): string {

    return this.appAuth.routePrefix;
  }

  constructor(
    private ref: ChangeDetectorRef,
    public appAuth: AuthService,
    private appDataCompanies: DataCompaniesService,
    private appDateEvents: DataEventsService,
    private router: Router,
    private appLive: LiveStreamService,
    private activatedRoute: ActivatedRoute) {

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

    this.activatedRoute.paramMap.subscribe((data: any) => {

      console.log(data)
    });

    onAuthUIStateChange((authState, authData) => {

      this.ref.detectChanges();
    });

    this.flagLoading = true;

    this.companyDetails = await this.appDataCompanies.getCompanyDetails(this.appAuth.clientKey);

    this.flagLoading = false;
  }
}
