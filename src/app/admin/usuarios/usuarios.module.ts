import { NgModule } from "@angular/core";
import { FaIconLibrary, FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { SharedModule } from "../../shared.module";
import {AdminUsuariosEditComponent} from './usuarios-edit.component';
import {AdminUsuariosListComponent} from './usuarios-list.component';
import {AdminUsersRoutingModule} from './usuarios.routing.module';

@NgModule({
  declarations: [
    AdminUsuariosEditComponent,
    AdminUsuariosListComponent
  ],
  imports: [
    SharedModule,
    FontAwesomeModule,
    AdminUsersRoutingModule
  ],
  exports: [
    SharedModule,
    FontAwesomeModule
  ]
})
export class AdminUsersModule {

  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, far);
  }
}
