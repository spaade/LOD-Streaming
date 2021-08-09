
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';

import { CapitalizePipe } from '../pipes/capitalize.pipe';
import { FirstNamePipe } from '../pipes/first-name.pipe';

@NgModule({
  declarations: [
    CapitalizePipe,
    FirstNamePipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    CapitalizePipe,
    FirstNamePipe
  ]
})
export class SharedModule {}
