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
  selector: 'app-emp-auto-cadastro',
  templateUrl: './app-emp-auto-cadastro.component.html'
})
export class AppEmpAutoCadastroComponent implements OnInit {

  flagSavingData = false;

  flagEnrollSuccess = false;

  enrollMsg = '';

  cadastroForm: FormGroup;

  get companyName() {

    return '';
  }

  get loginLink() {
   
    return this.appAuth.routePrefix + '/login';
  }

  get eventConfig(): any {
    return {
      selfSubscriptionFields: {
        email: 'required',
        userName: 'required',
        password: 'required',
        companyBranch: 'optional',
        companyRole: 'hidden',
        phoneNumber: 'hidden',
      }
    }
  }

  get eventId()      { return this.cadastroForm.get('eventId');  }
  get userName()     { return this.cadastroForm.get('userName'); }
  get companyBranch(){ return this.cadastroForm.get('companyBranch'); }
  get companyRole()  { return this.cadastroForm.get('companyRole'); }
  get phoneNumber()  { return this.cadastroForm.get('phoneNumber'); }
  get email()        { return this.cadastroForm.get('email'); }
  get password()     { return this.cadastroForm.get('password'); }
  get docNumber()    { return this.cadastroForm.get('docNumber'); }

  get loginRoute(): string {

    // this to support both subdomains and /companyId, so either
    // clientId.lod.com.vc/eventId or
    // lod.com.vc/clientId/eventId
    return this.appAuth.routePrefix + '/login';
  }

  constructor(
    private ref: ChangeDetectorRef,
    private fb: FormBuilder,
    public appAuth: AuthService,
    private appDataCompanyUsers: DataCompanyUsersService ) {

    this.newForm();
  }

  passInputType = 'password';

  showField(fieldName) {

    return this.eventConfig.selfSubscriptionFields[fieldName] != 'hidden';
  }

  newForm() {

    this.cadastroForm = new FormGroup({
      eventId:  new FormControl(''),
      userName: new FormControl('', this.eventConfig.selfSubscriptionFields.email == 'required' ? Validators.required : null),
      companyBranch: new FormControl('', this.eventConfig.selfSubscriptionFields.companyBranch == 'required' ? Validators.required : null),
      companyRole: new FormControl('', this.eventConfig.selfSubscriptionFields.companyRole == 'required' ? Validators.required : null),
      phoneNumber: new FormControl('', this.eventConfig.selfSubscriptionFields.phoneNumber == 'required' ? Validators.required : null),
      email:    new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required),
      docNumber: new FormControl('', this.eventConfig.selfSubscriptionFields.docNumber == 'required' ? Validators.required : null)
    });
  }

  async ngOnInit() {

    console.log('onInit() auto cadastro');
 
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
          eventId: 'cluster-digital',
          email: this.email.value,
          companyBranch: this.companyBranch.value,
          companyRole: this.companyRole.value,
          phoneNumber: this.phoneNumber.value,
          name: this.userName.value,
          companyPassword: this.password.value
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

  toggleInputType() {
    
    this.passInputType = this.passInputType == 'password'  ? 'text' : 'password';
  }
}