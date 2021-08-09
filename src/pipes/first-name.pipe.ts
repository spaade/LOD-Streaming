import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'firstName'
})
export class FirstNamePipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
        
    if (!value || value == '') return '';

    if (value.includes(' ')) {

      value = value.split(' ')[0];
    }

    return value[0].toUpperCase() + value.substr(1).toLowerCase();
  }
}
