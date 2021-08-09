import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from 'src/services/auth.service';

import { onAuthUIStateChange } from '@aws-amplify/ui-components';
import { LiveStreamService } from 'src/services/liveStream.service';
import { DataCompaniesService } from 'src/services/data.companies.service';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormGroup, FormControl } from '@angular/forms';
import { DataCompanyUsersService } from 'src/services/data.companyUsers.service';

@Component({
  selector: 'app-emp-catho-cadastro',
  templateUrl: './app-emp-catho-cadastro.component.html'
})
export class AppEmpCathoCadastroComponent implements OnInit{

  cadastroForm: FormGroup;

  flagSavingData = false;

  flagEnrollSuccess = false;

  enrollMsg = '';

  get name() {

    return this.cadastroForm.get('name');
  }
  get surname() {

    return this.cadastroForm.get('surname');
  }
  get email() {
    return this.cadastroForm.get('email');
  }
  get phoneNumber() {

    return this.cadastroForm.get('phoneNumber');
  }
  get company() {

    return this.cadastroForm.get('company');
  }
  get companyRole() {

    return this.cadastroForm.get('companyRole');
  }
  get activeRole() {

    return this.cadastroForm.get('activeRole');
  }
  get totalEmployees() {

    return this.cadastroForm.get('totalEmployees');
  }
  get agreeWithFirstTerm() {

    return this.cadastroForm.get('agreeWithFirstTerm');
  }
  get agreeWithSecondTerm() {

    return this.cadastroForm.get('agreeWithSecondTerm');
  }

  constructor(
    private ref: ChangeDetectorRef,
    private fb: FormBuilder,
    public appAuth: AuthService,
    private appDataCompanyUsers: DataCompanyUsersService ) {

    this.cadastroForm = new FormGroup({
      name: new FormControl('', Validators.required),
      surname: new FormControl('', Validators.required),
      email: new FormControl('',  Validators.required),
      phoneNumber: new FormControl(''),
      company: new FormControl(''),
      companyRole: new FormControl(''),
      activeRole: new FormControl(''),
      totalEmployees: new FormControl(''),
      agreeWithFirstTerm: new FormControl(),
      agreeWithSecondTerm: new FormControl()
    });

  }

  ngOnInit() {

    let params: any = document.location.search;

    if (params) {

      params = params.split('=');

      if (params.length > 1 && params[0].includes('evento')) {

        this.cadastroForm.get('eventId').setValue(params[1]);
      }
    }

    try { document.getElementById('txtAcName').focus(); } catch(err) {}

    onAuthUIStateChange((authState, authData) => {

      this.ref.detectChanges();
    });
  }

  sendForm() {

    this.cadastroForm.markAllAsTouched();

    if (this.cadastroForm.valid) {

      this.flagSavingData = true;

      window.setTimeout(async () => {


        let newUser = {
          companyId: this.appAuth.clientKey,
          email: this.email.value,
          name: `${this.name.value} ${this.surname.value}`,

          companyPassword: this.appAuth.clientKey,

          companyRole: this.companyRole.value,
          companyBranch: this.company.value,
          phoneNumber: this.phoneNumber.value,

        }

        let result = await this.appDataCompanyUsers.saveCompanyUser(newUser);

        //let result = { error: false };

        if (!result.error) {

          this.flagEnrollSuccess = true;
          this.enrollMsg = 'Cadastro realizado com sucesso!';

        } else {

          this.flagEnrollSuccess = false;
          this.enrollMsg = 'Erro no cadastro: ' + result.error;
        }

        this.flagSavingData = false;

      }, 1200);
    }
  }
}
