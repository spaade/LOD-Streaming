import { Injectable } from '@angular/core';
import { CognitoUserInterface,  AuthState } from '@aws-amplify/ui-components';
import {LodStreamChatMsg} from '../models/lodStreamChatMsg.model';
import {API, Auth} from 'aws-amplify';
import {AuthService} from './auth.service';
import {LiveStreamService} from './liveStream.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  flagPostingChat = false;
  flagChatLoaded = false;
  flagLoadingChat = false;

  streamId: string = '';

  postingChatDelay = 0;

  chatPostInterval;
  chatStateInterval = null;

  clearStreamFlagTimeout = null;

  getChatCutoff = 0;

  get chatHasMessages() {

    return this.chatMessages.length > 0;
  }

  chatMessages: Array<LodStreamChatMsg> = [];

  constructor(private appAuth: AuthService, private appLive: LiveStreamService) {}

  startProcessingChat() {

    console.log('Starting chat ', this.chatStateInterval);

    if (this.chatStateInterval == null) {

      this.getChatState();

      this.chatStateInterval = window.setInterval(() => {

        this.getChatState();

      }, 5000);
    }
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
        streamId: this.appAuth.eventKey,
        isLoggedUser: true,
        isAdmin: this.appAuth.userIsLod
      });

      window.setTimeout(async () => {

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

  async getChatState() {

    try {

      if (this.flagLoadingChat) {

        console.log('Aguardando retorno do chat');

        this.clearStreamFlagTimeout =
          window.setTimeout(() => {
            this.flagLoadingChat = false; //libera caso o retorno não volte e a flag fique grudada. 18s.
          }, 18000);

        return;
      }

      this.flagLoadingChat = true;

      let token = (await Auth.currentSession()).getIdToken().getJwtToken();

      const opts = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        response: true
      };

      let url = '/streamChats?streamId=' + this.appAuth.eventKey;

      if (this.getChatCutoff == 0) {

        //just the first time, get from past 20 mins or so
        this.getChatCutoff = new Date(new Date().getTime() - 1200000).getTime();

        url += '&sdate=' + this.getChatCutoff;
      }

      API
        .get('lodStreamChatsApi', url, opts)
        .then((response) => {

          if (!response.error) {

            try {
              window.clearInterval(this.clearStreamFlagTimeout);
            } catch(errTm){}

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

  processChatState(state: Array<any>) {

    //console.log('process chat ' + state.length + ' items');

    for (let i = 0; i < state.length; i++) {

      let newChatMsg = new LodStreamChatMsg(state[i]);

      let msgId = 'msg-' + newChatMsg.id;

      if (document.getElementsByClassName(msgId).length == 0) {

        if ( newChatMsg.userId == '40993550-471c-4d77-96a3-b9a01d64efdf'
        || newChatMsg.userId == '53720cb6-d7a1-4dcd-88ff-e1cb0dff6dc5'
        || newChatMsg.userId == 'bf624ee9-c721-4732-a9d3-e1b5399dee1f') {

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


}
