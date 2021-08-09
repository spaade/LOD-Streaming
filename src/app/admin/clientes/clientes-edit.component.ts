import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UiService} from 'src/services/ui.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from 'src/services/auth.service';
import {DataCompaniesService} from '../../../services/data.companies.service';
import {ActivatedRoute} from '@angular/router';
import {LodCompany} from '../../../models/lodCompany.model';
import {onAuthUIStateChange} from '@aws-amplify/ui-components';

@Component({
  selector: 'app-admin-clientes-edit',
  templateUrl: './clientes-edit.component.html',
})
export class AdminClientesEditComponent implements OnInit {

  public editingItem: LodCompany = new LodCompany();

  flagSavingData = false;

  flagLoadingItem = false;

  cadastroForm: FormGroup

  get flagLoadingData() {

    return this.appDataCompanies.flagLoadingData;
  }

  //region Form Getters

  get companyName() { return this.cadastroForm.get('companyName'); }
  get companyStatus() { return this.cadastroForm.get('companyStatus'); }
  get subdomains() { return this.cadastroForm.get('subdomains'); }

  //endregion

  constructor(
    private appDataCompanies: DataCompaniesService,
    private appAuth: AuthService,
    private appUi: UiService,
    private activatedRoute: ActivatedRoute,
    private ref: ChangeDetectorRef,
  ) {

    this.cadastroForm = new FormGroup({
      companyName: new FormControl(''),
      subdomains: new FormControl(''),
      companyStatus: new FormControl(''),
    });

  }

  async ngOnInit() {

    this.activatedRoute.paramMap.subscribe((data: any) => {

      this.loadEditingItem(data.params.companyId)
    });

    let params: any = document.location.search;

    if (params) {

      params = params.split('=');

      if (params.length > 1 && params[0].includes('active')) {

        this.cadastroForm.get('active').setValue(params[1]);
      }
    }

    try { document.getElementById('txtCompanyName').focus(); } catch(err) {}

    onAuthUIStateChange((authState, authData) => {

      this.ref.detectChanges();
    });

  }

  async loadEditingItem(itemId) {

    this.flagLoadingItem = true;

    let company = await this.appDataCompanies.getCompany(itemId)

    this.editingItem = new LodCompany(company);

    this.companyName.setValue(this.editingItem.companyName);
    this.subdomains.setValue(this.editingItem.subdomains);
    this.companyStatus.setValue(this.editingItem.companyStatus);

    this.flagLoadingItem = false;

  }

  sendForm() {

    this.cadastroForm.markAllAsTouched();

    if (this.cadastroForm.valid) {

      this.flagSavingData = true;

      window.setTimeout(async () => {

        let newCompany = {
          groupId: 'main-companies',
          companyName: this.companyName.value,
          companyStatus: this.companyStatus.value,
          subdomains: this.subdomains.value
        }

        if(this.editingItem && this.editingItem.id != '') {

          newCompany['id'] = this.editingItem.id;
        }

        let result = await this.appDataCompanies.saveCompany(newCompany);

        if (!result.error) {

          this.appUi.showMsg('Dados salvos com sucesso!');;

        } else {

          this.appUi.showMsg('Erro ao salvar dados!' + result.error) ;
        }

        this.flagSavingData = false;

      }, 1200);
    }
  }

}
