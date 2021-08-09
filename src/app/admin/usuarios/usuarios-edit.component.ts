import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {LodCompanyUser} from 'src/models/lodCompanyUser.model';
import {UiService} from 'src/services/ui.service';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from 'src/services/auth.service';
import {DataCompanyUsersService} from 'src/services/data.companyUsers.service';
import {onAuthUIStateChange} from '@aws-amplify/ui-components';
import {DataCompaniesService} from '../../../services/data.companies.service';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-admin-usuarios-edit',
  templateUrl: './usuarios-edit.component.html',
})
export class AdminUsuariosEditComponent implements OnInit {

  public editingItem: LodCompanyUser = new LodCompanyUser();

  flagSavingData = false;

  flagLoadingItem = false;

  cadastroForm: FormGroup;

  get flagLoadingData() {

    return this.appDataCompanyUsers.flagLoadingData;
  }

  //region Form Getters

  get name()            { return this.cadastroForm.get('name'); }
  get companyUserName() { return this.cadastroForm.get('companyUserName'); }
  get companyBranch()   { return this.cadastroForm.get('companyBranch'); }
  get companyRole()     { return this.cadastroForm.get('companyRole'); }
  get phoneNumber()     { return this.cadastroForm.get('phoneNumber'); }
  get email()           { return this.cadastroForm.get('email'); }
  get companyPassword() { return this.cadastroForm.get('companyPassword'); }

  //endregion

  constructor(
    private appUi: UiService,
    private ref: ChangeDetectorRef,
    private fb: FormBuilder,
    public appAuth: AuthService,
    private appDataCompanyUsers: DataCompanyUsersService,
    public appDataCompanies: DataCompaniesService,
    private activatedRoute: ActivatedRoute
  ) {

    this.cadastroForm = new FormGroup({
      name: new FormControl('', Validators.required),
      companyUserName: new FormControl(''),
      companyBranch: new FormControl(''),
      companyRole: new FormControl(''),
      phoneNumber: new FormControl(''),
      email: new FormControl('', [Validators.required, Validators.email]),
      companyPassword: new FormControl('', Validators.required)
    });
  }

  async ngOnInit() {

    this.activatedRoute.paramMap.subscribe((data: any) => {

      return this.loadEditingItem(data.params.userId)
    })

    let params: any = document.location.search;

    if (params) {

      params = params.split('=');

      if (params.length > 1 && params[0].includes('active')) {

        this.cadastroForm.get('active').setValue(params[1]);
      }
    }

    try { document.getElementById('txtAcName').focus(); } catch(err) {}

    onAuthUIStateChange((authState, authData) => {

      this.ref.detectChanges();
    });
  }

  async loadEditingItem(itemId) {

    this.flagLoadingItem = true;

    let user = await this.appDataCompanyUsers.getCompanyUser(this.appDataCompanies.selectedCompanyId, itemId);

    this.editingItem = new LodCompanyUser(user);

    this.name.setValue(this.editingItem.name);
    this.email.setValue(this.editingItem.email);
    this.companyBranch.setValue(this.editingItem.companyBranch);
    this.companyRole.setValue(this.editingItem.companyRole);
    this.phoneNumber.setValue(this.editingItem.phoneNumber);
    this.companyUserName.setValue(this.editingItem.companyUserName);
    this.companyPassword.setValue(this.editingItem.companyPassword);

    this.flagLoadingItem = false;
  }

  sendForm() {

    this.cadastroForm.markAllAsTouched();

    if (this.cadastroForm.valid) {

      this.flagSavingData = true;

      window.setTimeout(async () => {

        let newUser = {
          companyId: this.appDataCompanies.selectedCompanyId,
          email: this.email.value,
          companyBranch: this.companyBranch.value,
          companyRole: this.companyRole.value,
          phoneNumber: this.phoneNumber.value,
          name: this.name.value,
          companyUserName: this.companyUserName.value,
          companyPassword: this.companyPassword.value
        }

        if(this.editingItem && this.editingItem.userId != '') {

          newUser['userId'] = this.editingItem.userId;
        }

        if(this.companyUserName.value == '') {

          newUser['companyUserName'] = this.email.value;
        }

        const result = await this.appDataCompanyUsers.saveCompanyUser(newUser);

        if (!result.error) {

          this.appUi.showMsg('Dados salvos com sucesso!');

          this.resetForm();

        } else {

          this.appUi.showMsg('Erro ao salvar dados!' + result.error) ;
        }

        this.flagSavingData = false;

      }, 1200);
    }
  }

  resetForm() {

    return this.cadastroForm.reset();
  }

}
