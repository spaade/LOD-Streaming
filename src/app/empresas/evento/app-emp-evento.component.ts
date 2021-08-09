import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/services/auth.service';

import { onAuthUIStateChange } from '@aws-amplify/ui-components';
import { API, Auth } from 'aws-amplify';
import { LiveStreamService } from 'src/services/liveStream.service';
import { LodStream } from 'src/models/lodStream.model';
import { LodEvent } from 'src/models/lodEvent.model';
import { DataEventsService } from 'src/services/data.events.service';

import * as intervalToDuration from 'date-fns/intervalToDuration';
import {ChatService} from '../../../services/chat.service';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-emp-evento',
  templateUrl: './app-emp-evento.component.html'
})
export class AppEmpEventoComponent implements OnInit {

  viewPanel = 'chat';

  get showTopMenuBtn(): boolean {

    return this.appAuth.clientKey != 'vigor';
  };

  flagPageLoading = true;

  flagShowingAgreement = false;
  flagPostingAgreement = false;

  flagShowingLeftPanel = true;

  flagNavChecked = false;

  streamUrl;
  flagSendingHeartbeat = false;

  flagInitializedChat = false;

  @Input()
  event: LodEvent = null;

  eventId: string = null;

  get companyId(): string {

    return this.appAuth.clientKey;
  }

  get eventLogo(): string {

    if (this.appAuth.clientKey == 'vigor') {
      return '/assets/clientes/vigor/VIV-logo-evento.gif';
    } else {
      return null;
    }
  }

  get isEventInTheFuture() {

    return (this.event.startDate > new Date().getTime());
  }

  get isEventInThePast() {

    return (this.event.endDate < new Date().getTime());
  }

  get routePrefix() {

    return this.appAuth.routePrefix;
  }

  private _hasUser = false;

  get logoutUrl() {

    try {

      return '/' + this.appAuth.clientKey + '/logout';

    } catch(err) {    }

    return '/logout';
  }

  get hasUser(): boolean {

    return this.appAuth.userIsLogged;
  }

  get userName(): string {

    let u = '';

    if (this.appAuth.user && this.appAuth.user.attributes) {

      u = this.appAuth.user.attributes.name;

      if (u.includes(' ')) {

        u = u.split(' ')[0];
      }

      u = u.toUpperCase()[0] + u.toLowerCase().substring(1);
    }

    return u;
  }

  get stream(): LodStream {

    return this.appLive.currentStream;
  }

  get eventRunning() {

    if (!this.event) {

      return false;

    } else {

      let startDate = this.event.startDate;
      let endDate = this.event.endDate;

      return startDate < new Date().getTime() && endDate > new Date().getTime();
    }
  }

  get timeToEvent() {

    let startDate = this.event.startDate;

    let result = '';
    let duration = intervalToDuration.default({ start: new Date(), end: new Date(startDate) });

    if (duration.days > 0 ){
      result += duration.days + ' dias, ';
    }

    if (duration.hours > 0 || duration.days > 0 ){
      result += duration.hours + ' horas, ';
    }

    if (duration.minutes > 0 || duration.hours > 0 || duration.days > 0){
      result += 'e ' + duration.minutes + ' minutos, ';
    }

    // takes out ', ' and , e to
    result = result.substr(0, result.length - 2).replace(', e', ' e');

    return result;
  }

  get videoStreamUrl() {

    return 'https://player.vimeo.com/video/534395225';
  }

  constructor(
    private ref: ChangeDetectorRef,
    public appAuth: AuthService,
    public appDataEvents: DataEventsService,
    private router: Router,
    private appLive: LiveStreamService,
    private appChat: ChatService,
    private _sanitizer: DomSanitizer) {

  }

  async ngOnInit() {

    if (!this.event) {

      debugger;
      let evt = await this.appDataEvents.getEventDetails(this.appAuth.clientKey, this.appAuth.eventKey);

      this.event = new LodEvent(evt);
    }

    document.title = this.appAuth.clientKeyAsName + ' ' + this.event.eventName;

    this.heartbeat();

    window.setInterval(() => {

      this.heartbeat();

    }, 180000);

    onAuthUIStateChange((authState, authData) => {

      this.ref.detectChanges();
    });

    for (let i = 0; i < this.event.streams.length; i++) {

      this.streamUrl = this._sanitizer.bypassSecurityTrustResourceUrl(this.event.streams[i].streamVimeoUrl);
    }
  }

  toggleLeftPanel() {

    this.flagShowingLeftPanel = !this.flagShowingLeftPanel;
  }

  showPlayer() {

    try {

      document.getElementsByClassName('panel-loading-msg')[0].setAttribute('style', 'display: none');

      document.getElementById('whatsLink').setAttribute('href', this.stream.socialMediaUrl);

    } catch (err) {}
  }

  showAgreement() {

    this.flagPageLoading = false;

    window.setTimeout(() => {

      document.getElementsByClassName('panel-loading-msg')[0].setAttribute('style', 'display: none');

      document.getElementById('agreementContent').setAttribute('src', this.stream.agreementUrl);

      this.flagShowingAgreement = true;

    }, 300);

  }

  async heartbeat() {

    try {

      if (this.flagSendingHeartbeat) return;

      this.flagSendingHeartbeat = true;

      let token = (await Auth.currentSession()).getIdToken().getJwtToken();

      const opts = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
        body: {}
      };

      API
        .put('liveDataApi', '/livedata/heartbeat', opts)
        .then((response) => {

          if (this.flagPageLoading) {

            /*
            if(!response.data.agreementUrl || response.data.agreementUrl == '') {
              response.data.agreementUrl = '/assets/clientes/beckman/termo-evento.pdf';
            }
            */

            this.appLive.currentStream = new LodStream({
              id: response.data.id,
              streamName: response.data.streamName,
              requiresAgreement: response.data.requiresAgreement,
              agreementUrl: response.data.agreementUrl,
              streamUrl: response.data.streamUrl,
              socialMediaUrl: response.data.streamWhats
            });

            if (!this.appLive.currentStream.id || this.appLive.currentStream.id == '') {
              this.appLive.currentStream.id = this.appAuth.eventKey;
            }

            //if (response.data.requiresAgreement) {

            let agreeInfo = this.appAuth.user.attributes['zoneinfo'];

            let hasAgreed = true;

            /*
            try {

              let agrmt = window.localStorage.getItem('agreement');

              if (agrmt && new Date(parseInt(agrmt)).getDate() == new Date().getDate()) {

                hasAgreed = true;
              }

            } catch(err) {}
            */

            this.flagSendingHeartbeat = false;

            if (!hasAgreed &&
               (!agreeInfo || !agreeInfo.includes(this.appLive.currentStream.id))
               ) { // this could work for multiple events wit comma

              this.showAgreement();

            } else {

              this.flagPageLoading = false;

              if (!this.flagInitializedChat) {

                window.setTimeout(() => {

                  this.showPlayer();
  
                  this.appChat.startProcessingChat();
  
                }, 250);
              }
            }
          }

        })
        .catch((error) => {

          console.log('erro:', error);

      });


    } catch(err) {}

  }

  async postAgreement() {

    this.flagPostingAgreement = true;

    window.setTimeout(async () => {

      try {

        let token = (await Auth.currentSession()).getIdToken().getJwtToken();

        const opts = {
          headers: {
            Authorization: `Bearer ${token}`
          },
          response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
          body: {}
        };

        API
          .put('liveDataApi', '/livedata/agreement', opts)
          .then((response) => {

            console.log('agreement response:', response);

            this.flagPageLoading = false;
            this.flagShowingAgreement = false;

            try {

              window.localStorage.setItem('agreement', new Date().getTime().toString());

            } catch(err) {}

            window.setTimeout(() => {

              this.showPlayer();

              this.appChat.startProcessingChat();

            }, 250);

          })
          .catch((error) => {

            console.log('erro:', error);

        });


      } catch(err) {}

    }, 1000);

  }


}
