import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { FaIconLibrary, FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { SelectCompanyComponent } from "src/components/selectCompany/selectCompany.component";
import { SharedModule } from "../shared.module";
import { AdminRoutingModule } from "./admin.routing.module";
import { AdminClientesComponent } from "./clientes/clientes.component";
import { AdminEventosComponent } from "./eventos/eventos.component";
import { AdminHomeComponent } from "./home/home.component";
import { AdminUsuariosComponent } from "./usuarios/usuarios.component";
import {MultiSelectModule} from 'primeng/multiselect';


const PRIME_MODULES = [
  MultiSelectModule
]

@NgModule({
  declarations: [
    AdminHomeComponent,
    AdminUsuariosComponent,
    AdminClientesComponent,
    AdminEventosComponent,
    SelectCompanyComponent
  ],
  imports: [
    ReactiveFormsModule,
    SharedModule,
    FontAwesomeModule,
    AdminRoutingModule,
    [...PRIME_MODULES]
  ],
  exports: [
    SharedModule,
    FontAwesomeModule,
    SelectCompanyComponent
  ]
})
export class AdminModule {

  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, far);
  }
}
