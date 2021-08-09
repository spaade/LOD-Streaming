import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UiService} from 'src/services/ui.service';
import {AuthService} from 'src/services/auth.service';
import {onAuthUIStateChange} from '@aws-amplify/ui-components';
import {DataCompaniesService} from '../../../services/data.companies.service';

@Component({
  selector: 'app-admin-clientes-list',
  templateUrl: './clientes-list.component.html',
})
export class AdminClientesListComponent implements OnInit {

  get companies() {

    return this.appDataCompanies.companies;
  }

  get flagLoadingData() {

    return this.appDataCompanies.flagLoadingData;
  }

  constructor(
    private appUi: UiService,
    private ref: ChangeDetectorRef,
    public appAuth: AuthService,
    public appDataCompanies: DataCompaniesService
  ) {

  }

  async ngOnInit() {

    await this.appDataCompanies.getCompanies()

    onAuthUIStateChange((authState, authData) => {

      this.ref.detectChanges();
    });
  }


}
