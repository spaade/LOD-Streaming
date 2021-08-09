import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/services/auth.service';

import { onAuthUIStateChange, CognitoUserInterface, AuthState, FormFieldTypes } from '@aws-amplify/ui-components';
import { API, Auth } from 'aws-amplify';
import { LiveStreamService } from 'src/services/liveStream.service';
import { LodStream } from 'src/models/lodStream.model';
import { LodStreamChatMsg } from 'src/models/lodStreamChatMsg.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './app-dashboard.component.html'
})
export class AppDashboardComponent implements OnInit {

  flagShowingLeftPanel = true;

  flagPostingChat = false;

  flagChatLoaded = false;

  flagSendingHeartbeat = false;

  postingChatDelay = 0;

  chatPostInterval;

  chatStateInterval = null;

  getChatCutoff = 0;

  get chatHasMessages() {

    return this.chatMessages.length > 0;
  }

  get routePrefix() {

    return this.appAuth.routePrefix;
  }

  chatMessages: Array<LodStreamChatMsg> = [];

  constructor(
    private ref: ChangeDetectorRef,
    public appAuth: AuthService,
    private router: Router,
    private appLive: LiveStreamService ) {

  }

  private _hasUser = false;

  /*
  streamUrl: string  = 'https://vimeo.com/event/710422/embed/f247230cf7';
  streamWhats: string  = 'https://wa.me/message/OHYGBAQ2QUFDJ1';
  */

  flagPageLoading = true;
  flagShowingAgreement = false;
  flagPostingAgreement = false;

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

  ngOnInit(): void {

    this.heartbeat();

    window.setInterval(() => {

      this.heartbeat();

    }, 180000);

    onAuthUIStateChange((authState, authData) => {

      this.ref.detectChanges();
    });
  }

  toggleLeftPanel() {

    this.flagShowingLeftPanel = !this.flagShowingLeftPanel;
  }

  showPlayer() {

    try {

      document.getElementsByClassName('panel-loading-msg')[0].setAttribute('style', 'display: none');

      document.getElementById('vimeoFrame').setAttribute('src', this.stream.streamVimeoUrl);
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

  async getChatState() {

    try {

      let token = (await Auth.currentSession()).getIdToken().getJwtToken();

      const opts = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        response: true
      };

      let url = '/streamChats?streamId=' + this.appLive.currentStream.id;

      if (this.getChatCutoff == 0) {

        //just the first time, get from past 20 mins or so
        this.getChatCutoff = new Date(new Date().getTime() - 1200000).getTime();

        url += '&sdate=' + this.getChatCutoff;
      }

      API
        .get('lodStreamChatsApi', url, opts)
        .then((response) => {

          if (!response.error) {

            this.flagChatLoaded = true; // loaded once

            this.processChatState(response.data);

          } else {

            console.log('Chat GET error:', response.error);
          }
        });

    } catch(err) {

      console.log('Chat GET error:', err);
    }
  }

  startProcessingChat() {

    if (this.chatStateInterval == null) {

      this.getChatState();

      this.chatStateInterval = window.setInterval(() => {

        this.getChatState();

      }, 5000);
    }
  }

  processChatState(state: Array<any>) {

    //console.log('process chat ' + state.length + ' items');

    for (let i = 0; i < state.length; i++) {

      let newChatMsg = new LodStreamChatMsg(state[i]);

      let msgId = 'msg-' + newChatMsg.id;

      if (document.getElementsByClassName(msgId).length == 0) {

        if (
           newChatMsg.userId == '40993550-471c-4d77-96a3-b9a01d64efdf'
        || newChatMsg.userId == '53720cb6-d7a1-4dcd-88ff-e1cb0dff6dc5') {

          newChatMsg.isAdmin = true;
          newChatMsg.userAlias = 'Admin';
        }

        if (newChatMsg.userId == this.appAuth.userId) {

          newChatMsg.isLoggedUser = true;
        }

        //we don't have it yet :)
        //console.log('Adding: ' + msgId);

        this.addChatMsg(newChatMsg);

      } else {

        //console.log('Already in: ' + msgId);
      }
    }
  }

  async heartbeat() {

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
        .put('liveDataApi', '/livedata/heartbeat', opts)
        .then((response) => {

          if (this.flagPageLoading) {

            if(!response.data.agreementUrl || response.data.agreementUrl == '') {
              response.data.agreementUrl = '/assets/clientes/beckman/termo-evento.pdf';
            }

            this.appLive.currentStream = new LodStream({
              id: response.data.id,
              streamName: '',
              requiresAgreement: response.data.requiresAgreement,
              agreementUrl: response.data.agreementUrl,
              streamUrl: 'https://player.vimeo.com/video/534560537',
              socialMediaUrl: response.data.streamWhats
            });

            if (!this.appLive.currentStream.id || this.appLive.currentStream.id == '') {
              this.appLive.currentStream.id = 'beckman-001';
            }

            //if (response.data.requiresAgreement) {

            let agreeInfo = this.appAuth.user.attributes['zoneinfo'];

            let hasAgreed = false;

            try {

              let agrmt = window.localStorage.getItem('agreement');

              if (agrmt && new Date(parseInt(agrmt)).getDate() == new Date().getDate()) {

                hasAgreed = true;
              }

            } catch(err) {}

            if (!hasAgreed &&
               (!agreeInfo || !agreeInfo.includes(this.appLive.currentStream.id))
               ) { // this could work for multiple events wit comma

              this.showAgreement();

            } else {

              this.flagPageLoading = false;

              window.setTimeout(() => {

                this.showPlayer();

                this.startProcessingChat();

              }, 250);
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

              this.startProcessingChat();

            }, 250);

          })
          .catch((error) => {

            console.log('erro:', error);

        });


      } catch(err) {}

    }, 1000);

  }

  addChatMsg(msgData: LodStreamChatMsg) {

    // push in date order:

    if (this.chatMessages.length == 0) {

      this.chatMessages.push(msgData);

    } else {

      let bigIdx = this.chatMessages.findIndex(m => m.msgDate > msgData.msgDate);

      if (bigIdx >= 0) {

        this.chatMessages.splice(bigIdx, 0, msgData);

      } else {
        // new msg is the latest, just add:

        this.chatMessages.push(msgData);
      }
    }

    document.getElementById('panelChat').scrollTo(0, 9000);
  }

  basicFilter(val: string) {

    let entityMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': '&quot;',
      "'": '&#39;',
      "/": '&#x2F;'
    };

    return val.replace(/[&<>"'\/]/g, (s) => {
        return entityMap[s];
    });
  }

  postChat() {

    let txt = document.getElementById('txtPostChat')['value'];

    if (!this.flagPostingChat && txt != '') {

      txt = this.basicFilter(txt);

      txt = txt.replace(/(?:\r\n|\r|\n)/g, '<br>');

      this.flagPostingChat = true;
      this.postingChatDelay = 10;

      let newChat = new LodStreamChatMsg({
        text: txt,
        userAlias: this.appAuth.userAlias,
        streamId: this.appLive.currentStream.id,
        isLoggedUser: true,
        isAdmin: this.appAuth.userIsLod
      });

      window.setTimeout(async () => {

        //test:

        /*
        document.getElementById('txtPostChat')['value'] = '';

        this.addChatMsg(newChat);
        */

        let token = (await Auth.currentSession()).getIdToken().getJwtToken();

        const opts = {
          headers: {
            Authorization: `Bearer ${token}`
          },
          response: false,
          body: {
            text: newChat.text,
            streamId: newChat.streamId,
            userAlias: newChat.userAlias
           }
        };

        API
          .put('lodStreamChatsApi', '/streamChats', opts)
          .then((response) => {

            if(!response.error) {

              //add msg to ui
              document.getElementById('txtPostChat')['value'] = '';

              newChat.id = response.data.id;

              this.addChatMsg(newChat);

            } else {

              console.log('chat error:', response.error);
            }

          });

      }, 1000);

      this.chatPostInterval = window.setInterval(() => {

        this.postingChatDelay--;

        //console.log('chat delay: ' + this.postingChatDelay);

        if (this.postingChatDelay == 0) {

          this.flagPostingChat = false;
          window.clearInterval(this.chatPostInterval);
        }

      }, 1000);
    }
  }
}
