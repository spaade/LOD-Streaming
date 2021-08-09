import { Injectable } from '@angular/core';
import { LodStream } from 'src/models/lodStream.model';

@Injectable({
  providedIn: 'root'
})
export class LiveStreamService {

  currentStream: LodStream;

  startForClient(stream: any) {

    this.currentStream = new LodStream(stream);
  }

  async postChat(msgText: string) {

    
  }
}