import { Component, OnInit } from '@angular/core';
import { DataCompaniesService } from 'src/services/data.companies.service';

@Component({
  selector: 'app-select-company',
  templateUrl: './selectCompany.component.html'
})
export class SelectCompanyComponent implements OnInit {

  get companies(){

    return this.appDataCompanies.companies;
  }

  get selectedCompanyId() {

    return this.appDataCompanies.selectedCompanyId;
  }

  set selectedCompanyId(val) {

    this.appDataCompanies.selectedCompanyId = val;
  }

  get flagHasCompany() {

    return (this.appDataCompanies.selectedCompany != null);
  }

  constructor(public appDataCompanies: DataCompaniesService){  }

  selectCompany() {

    let co = this.companies.find(c => c.id == this.selectedCompanyId);

    this.appDataCompanies.selectCompany(co);
  }

  resetCompany() {

    this.appDataCompanies.selectCompany(null);

    return false;
  }

  async ngOnInit() {

    await this.appDataCompanies.getCompanies();
  }
}
