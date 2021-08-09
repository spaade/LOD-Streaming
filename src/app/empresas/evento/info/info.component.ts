import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {DataCompaniesService} from '../../../../services/data.companies.service';
import {onAuthUIStateChange} from '@aws-amplify/ui-components';
import {AuthService} from '../../../../services/auth.service';
import {DataEventsService} from '../../../../services/data.events.service';
import {LodEvent} from '../../../../models/lodEvent.model';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-admin-evento-info',
  templateUrl: './info.component.html'
})
export class AppEmpEventoInfoComponent implements OnInit {

  flagLoadingData;

  companyDetails;
  eventDetails;

  startDate;
  endDate;

  get company() { return this.appDataCompany.getCompany(this.appAuth.clientKey); }

  constructor(
    private ref: ChangeDetectorRef,
    public appAuth: AuthService,
    private appDataCompany: DataCompaniesService,
    private appDataEvents: DataEventsService,
    private activatedRoute: ActivatedRoute
  ) {}

  async ngOnInit() {

    this.companyDetails = await this.company;

    this.activatedRoute.paramMap.subscribe( (data: any) => {

      this.loadEvent(data.params.submodule)
    })

    onAuthUIStateChange((authState, authData) => {

      this.ref.detectChanges();
    });
  }

  async loadEvent(eventId) {

    this.flagLoadingData = true;

    let event = await this.appDataEvents.getEvent(this.appAuth.clientKey, eventId);

    this.eventDetails = new LodEvent(event);

    let tzOffSet = (new Date()).getTimezoneOffset() * 60000;

    this.startDate = new Date(this.eventDetails.startDate).toLocaleString('pt-BR').substr(0,16);
    this.endDate = new Date(this.eventDetails.endDate ).toLocaleString('pt-BR').substr(0,16);

    this.flagLoadingData = false;
  }

}
