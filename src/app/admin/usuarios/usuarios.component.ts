import {Component, OnInit} from '@angular/core';
import {AuthService} from 'src/services/auth.service';
import {DataCompaniesService} from '../../../services/data.companies.service';

@Component({
  selector: 'app-admin-usuarios',
  templateUrl: './usuarios.component.html',
})
export class AdminUsuariosComponent implements OnInit {

  get flagHasCompany() {

    return this.appDataCompanies.selectedCompanyId != null;
  }

  constructor(
    public appAuth: AuthService,
    public appDataCompanies: DataCompaniesService
  ) {

  }

  async ngOnInit() {

  }

}
