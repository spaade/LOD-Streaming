import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UiService} from 'src/services/ui.service';
import {FormBuilder,} from '@angular/forms';
import {AuthService} from 'src/services/auth.service';
import {DataCompanyUsersService} from 'src/services/data.companyUsers.service';
import {onAuthUIStateChange} from '@aws-amplify/ui-components';
import {DataCompaniesService} from '../../../services/data.companies.service';
import {DataEventsService} from '../../../services/data.events.service';

@Component({
  selector: 'app-admin-eventos-list',
  templateUrl: './eventos-list.component.html',
})
export class AdminEventosListComponent implements OnInit {

  //region List and Edit Getters

  get events() {

    return this.appDataEvents.events;
  }

  get flagLoadingData() {

    return this.appDataEvents.flagLoadingData;
  }

  //endregion

  constructor(
    private appUi: UiService,
    private ref: ChangeDetectorRef,
    private fb: FormBuilder,
    public appAuth: AuthService,
    private appDataEvents: DataEventsService,
    public appDataCompanies: DataCompaniesService
  ) {
  }

  async ngOnInit() {

    await this.appDataEvents.getEvents(

      this.appDataCompanies.selectedCompanyId
    );

    onAuthUIStateChange((authState, authData) => {

      this.ref.detectChanges();
    });
  }
}
