import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/services/auth.service';
import { UiService } from 'src/services/ui.service';
import { NavigationEnd, Router } from '@angular/router';



@Component({
  selector: 'app-admin-index',
  templateUrl: './index.component.html'
})
export class AdminIndexComponent implements OnInit {

  flagShowSelectedCompany = false;

  get routePrefix() {

    return this.appAuth.routePrefix;
  }

  constructor(public appAuth: AuthService,
              private router: Router,
              public appUi: UiService) {

    this.router.events.subscribe((event) => {

      if (event instanceof NavigationEnd) {

        this.checkNav();

      } else {

        //console.log('navigate  evt:', event);
      }
    });
  }

  async checkNav() {

    let url = document.location.pathname.toLowerCase();

    if (url[0] == '/') url = url.substr(1);

    let modules = url.split('/');

    this.flagShowSelectedCompany = (modules[1] && modules[1] !== 'clientes');
  }


  ngOnInit(): void {



    document.body.setAttribute('class', 'body-' + this.appAuth.clientKey);
  }
}
