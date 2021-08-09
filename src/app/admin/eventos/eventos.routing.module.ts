import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AdminEventosComponent} from './eventos.component';
import {AdminEventosEditComponent} from './eventos-edit.component';
import {AdminEventosListComponent} from './eventos-list.component';

const routes: Routes = [
  {
    path: '',
    component: AdminEventosComponent,
    children: [
      {
        path: 'novo', component: AdminEventosEditComponent
      },
      {
        path: '', component: AdminEventosListComponent
      },
      {
        path: ':eventId', component: AdminEventosEditComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminEventsRoutingModule { }
