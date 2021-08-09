import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UiService} from 'src/services/ui.service';
import {FormBuilder,} from '@angular/forms';
import {AuthService} from 'src/services/auth.service';
import {DataCompanyUsersService} from 'src/services/data.companyUsers.service';
import {onAuthUIStateChange} from '@aws-amplify/ui-components';
import {DataCompaniesService} from '../../../services/data.companies.service';

@Component({
  selector: 'app-admin-usuarios-list',
  templateUrl: './usuarios-list.component.html',
})
export class AdminUsuariosListComponent implements OnInit {

  //region List and Edit Getters

  get companyUsers() {

    return this.appDataCompanyUsers.companyUsers;
  }

  get flagLoadingData() {

    return this.appDataCompanyUsers.flagLoadingData;
  }

  //endregion

  constructor(
    private appUi: UiService,
    private ref: ChangeDetectorRef,
    private fb: FormBuilder,
    public appAuth: AuthService,
    private appDataCompanyUsers: DataCompanyUsersService,
    public appDataCompanies: DataCompaniesService
  ) {
  }

  async ngOnInit() {

    await this.appDataCompanyUsers.getCompanyUsers(

      this.appDataCompanies.selectedCompanyId
    );

    onAuthUIStateChange((authState, authData) => {

      this.ref.detectChanges();
    });
  }
}
