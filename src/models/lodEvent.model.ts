import {LodStream} from './lodStream.model';

export class LodEvent {

  companyId: string;
  id: string;

  eventName: string;
  eventDescription: string;
  eventStatus: string;

  startDate: number;
  endDate: number;

  creationDate: number;

  updatedDate: number;
  updatedUserName: string;

  logoImgUrl: string;

  homeBgImgUrl: string;
  loginBgImgUrl: string;
  signUpBgImgUrl: string;

  homeBgColor: string;
  loginBgColor: string;
  signUpBgColor: string;

  homeColor: string;
  loginColor: string;
  signUpColor: string;

  streams: Array<LodStream>;

  get isRunning() {

    let now = new Date().getTime();

    if (!this.startDate || this.startDate == 0) return false;

    if (!this.endDate || this.endDate == 0) return false;
    /*
    console.log('isRunning? ', {
      now: new Date(now),
      start: new Date(this.startDate),
      end:  new Date(this.endDate)
    });
    */
    return (this.startDate <= now && now <= this.endDate);
  }

  constructor(srcObj?: any) {

    if (srcObj) {
      Object.assign(this, srcObj);

      if (srcObj.streams) {

        let newStreams = [];

        for (let s = 0; s < srcObj.streams.length; s++) {

          newStreams.push(new LodStream(srcObj.streams[s]));
        }

        this.streams = newStreams;
      }
    }
  }
}
