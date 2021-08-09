import { NgModule } from "@angular/core";
import { FaIconLibrary, FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { SharedModule } from "../../shared.module";
import {AdminClientesEditComponent} from './clientes-edit.component';
import {AdminClientesListComponent} from './clientes-list.component';
import {AdminClientsRoutingModule} from './clientes.routing.module';

@NgModule({
  declarations: [
    AdminClientesEditComponent,
    AdminClientesListComponent
  ],
  imports: [
    SharedModule,
    FontAwesomeModule,
    AdminClientsRoutingModule
  ],
  exports: [
    SharedModule,
    FontAwesomeModule
  ]
})
export class AdminClientsModule {

  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, far);
  }
}
