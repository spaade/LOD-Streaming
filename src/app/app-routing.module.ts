import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './admin.guard';
import { AppComponent } from './app.component';
import { AppEmpresasComponent } from './empresas/app-empresas.component';
import { AppDashboardComponent } from './dashboard/app-dashboard.component';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
  {
    path: '', component: AppEmpresasComponent
  },
  {
    path: 'logout', component: AppComponent,
  },
  {
    path: 'dashboard', component: AppDashboardComponent
  },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    loadChildren:  () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: ':companyId', component: AppEmpresasComponent
  },
  {
    path: ':companyId/:submodule', component: AppEmpresasComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
