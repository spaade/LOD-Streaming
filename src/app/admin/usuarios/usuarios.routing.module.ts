import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AdminUsuariosListComponent} from './usuarios-list.component';
import {AdminUsuariosEditComponent} from './usuarios-edit.component';
import {AdminUsuariosComponent} from './usuarios.component';

const routes: Routes = [
  {
    path: '',
    component: AdminUsuariosComponent,
    children: [
      {
        path: 'novo', component: AdminUsuariosEditComponent
      },
      {
        path: '', component: AdminUsuariosListComponent
      },
      {
        path: ':userId', component: AdminUsuariosEditComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminUsersRoutingModule { }
