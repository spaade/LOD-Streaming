import { Component, OnInit } from '@angular/core';
import { DataCompaniesService } from 'src/services/data.companies.service';

@Component({
  selector: 'app-admin-eventos',
  templateUrl: './eventos.component.html'
})
export class AdminEventosComponent implements OnInit {

  get flagHasCompany() {

    return this.appDataCompanies.selectedCompanyId != null;
  }

  constructor(private appDataCompanies: DataCompaniesService){

  }

  async ngOnInit() {
  }
}
