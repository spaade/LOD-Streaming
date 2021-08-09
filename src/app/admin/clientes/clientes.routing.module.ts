import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AdminClientesComponent} from './clientes.component';
import {AdminClientesEditComponent} from './clientes-edit.component';
import {AdminClientesListComponent} from './clientes-list.component';

const routes: Routes = [
  {
    path: '',
    component: AdminClientesComponent,
    children: [
      {
        path: 'novo', component: AdminClientesEditComponent
      },
      {
        path: '', component: AdminClientesListComponent
      },
      {
        path: ':companyId', component: AdminClientesEditComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminClientsRoutingModule { }
