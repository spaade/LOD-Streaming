import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {

  msg = '';
  flagViewingMsg = false;

  showMsg(msg?: string) {

    if (msg) this.msg = msg;

    this.flagViewingMsg = true;
  }

  closeMsg() {

    this.flagViewingMsg = false;
  }
}
