import {ptBR} from '@angular/common/locales/global/pt';
import {registerLocaleData} from '@angular/common';

registerLocaleData(ptBR, 'pt-BR');

import {LOCALE_ID, NgModule} from '@angular/core';

import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';

import {SharedModule} from './shared.module';


/* Add Amplify imports */
import {AmplifyUIAngularModule} from '@aws-amplify/ui-angular';

import awsconfig from '../aws-exports';

import 'crypto-js/lib-typedarrays'; // add this line

import Amplify, {API, Auth} from 'aws-amplify';

import {AppDashboardComponent} from './dashboard/app-dashboard.component';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AdminIndexComponent} from './admin/index.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FontAwesomeModule, FaIconLibrary} from '@fortawesome/angular-fontawesome';

import {fas} from '@fortawesome/free-solid-svg-icons';
import {far} from '@fortawesome/free-regular-svg-icons';
import {LoginComponent} from './login/login.component';
import {AppEmpresasComponent} from './empresas/app-empresas.component';
import {AppEmpAutoCadastroComponent} from './empresas/auto-cadastro/app-emp-auto-cadastro.component';
import {AppEmpHomeComponent} from './empresas/home/app-emp-home.component';
import {ReactiveFormsModule} from '@angular/forms';
import {AppEmpLoginComponent} from './empresas/login/app-emp-login.component';
import {AppEmpEventoComponent} from './empresas/evento/app-emp-evento.component';
import {AdminModule} from './admin/admin.module';
import {AppEmpEventoChatComponent} from './empresas/evento/chat/chat.component';
import {AppEmpEventoQuizesComponent} from './empresas/evento/quizes/quizes.component';
import {AppEmpEventoInfoComponent} from './empresas/evento/info/info.component';
import {AppEmpEventoAjudaComponent} from './empresas/evento/ajuda/ajuda.component';
import {MultiSelectModule} from 'primeng/multiselect';
import {NbThemeModule, NbLayoutModule} from '@nebular/theme';
import {NbEvaIconsModule} from '@nebular/eva-icons';
import {TranslationDropdownComponent} from '../components/translationDropdown/translationDropdown.component';
import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {LinguagemInterceptor} from '../interceptors/linguagem.interceptor';
import { AppEmpCathoCadastroComponent } from './empresas/auto-cadastro/catho/app-emp-catho-cadastro.component';

Amplify.register(Auth);
//Amplify.register(API);

Amplify.configure({
  ...awsconfig,
  authenticationFlowType: 'USER_PASSWORD_AUTH'
});

// @ts-ignore
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AdminIndexComponent,
    AppEmpresasComponent,
    AppEmpHomeComponent,
    AppEmpLoginComponent,
    AppEmpEventoComponent,
    AppEmpEventoChatComponent,
    AppEmpAutoCadastroComponent,
    AppDashboardComponent,
    AppEmpEventoQuizesComponent,
    AppEmpEventoInfoComponent,
    AppEmpEventoAjudaComponent,
    TranslationDropdownComponent,
    AppEmpCathoCadastroComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AmplifyUIAngularModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    SharedModule,
    NgbModule,
    FontAwesomeModule,
    AdminModule,
    NbEvaIconsModule,
    MultiSelectModule,
    NbThemeModule.forRoot()
  ],
  exports: [
    SharedModule,
    FontAwesomeModule
  ],
  providers: [
    {
      provide: LOCALE_ID, useValue: 'pt-BR'
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LinguagemInterceptor,
      multi: true
    }
    ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, far);
  }
}
