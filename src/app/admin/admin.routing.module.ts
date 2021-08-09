import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminHomeComponent } from './home/home.component';
import { AdminIndexComponent } from './index.component';

const routes: Routes = [
  {
    path: '',
    component: AdminIndexComponent,
    children: [
      {
        path: 'clientes',
        loadChildren:  () => import('./clientes/clientes.module').then(m => m.AdminClientsModule)
      },
      {
        path: 'eventos',
        loadChildren:  () => import('./eventos/eventos.module').then(m => m.AdminEventsModule)
      },
      {
        path: 'usuarios',
        loadChildren:  () => import('./usuarios/usuarios.module').then(m => m.AdminUsersModule)
      },
      {
        path: '',
        component: AdminHomeComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
