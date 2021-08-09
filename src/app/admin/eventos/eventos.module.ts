import {NgModule} from '@angular/core';
import {FaIconLibrary, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {far} from '@fortawesome/free-regular-svg-icons';
import {fas} from '@fortawesome/free-solid-svg-icons';
import {SharedModule} from '../../shared.module';
import {AdminEventosEditComponent} from './eventos-edit.component';
import {AdminEventosListComponent} from './eventos-list.component';
import {AdminEventsRoutingModule} from './eventos.routing.module';
import {MultiSelectModule} from 'primeng/multiselect';
import {ColorPickerModule} from 'ngx-color-picker';
import {TabViewModule} from 'primeng/tabview';
import {CalendarModule} from 'primeng/calendar';

const PRIME_MODULES = [
  MultiSelectModule,
  TabViewModule
];


@NgModule({
  declarations: [
    AdminEventosEditComponent,
    AdminEventosListComponent
  ],
  imports: [
    SharedModule,
    FontAwesomeModule,
    AdminEventsRoutingModule,
    MultiSelectModule,
    TabViewModule,
    ColorPickerModule,
    [...PRIME_MODULES],
    CalendarModule,
  ],
  exports: [
    SharedModule,
    FontAwesomeModule
  ]
})
export class AdminEventsModule {

  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, far);
  }
}
