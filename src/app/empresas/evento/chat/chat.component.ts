import { Component, OnInit } from '@angular/core';
import {AuthService} from '../../../../services/auth.service';
import {ChatService} from '../../../../services/chat.service';

@Component({
  selector: 'app-admin-evento-chat',
  templateUrl: './chat.component.html'
})
export class AppEmpEventoChatComponent implements OnInit {

  get flagChatLoaded() { return this.appChat.flagChatLoaded; }
  get flagPostingChat() { return this.appChat.flagPostingChat; }
  get chatHasMessages() { return this.appChat.chatHasMessages; }
  get chatMessages() { return this.appChat.chatMessages; }
  get postingChatDelay() { return this.appChat.postingChatDelay; }

  constructor(
    public appAuth: AuthService,
    public appChat: ChatService
  ) {}

  async ngOnInit() {

  }

}
