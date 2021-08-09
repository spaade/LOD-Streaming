import { LodEvent } from "./lodEvent.model";

export class LodCompany {
  id: string;
  groupId: string;

  companyName: string;
  companyStatus: string; // active | inactive

  updatedDate: number;
  updatedUserName: string;

  enableSelfEnrollment: boolean;
  subdomains: string;

  events: Array<LodEvent>;

  constructor(baseObj?: any) {

    if (baseObj) {

      Object.assign(this, baseObj);
      
      if (baseObj.events) {

        let newEvents = [];

        for (let e = 0; e < baseObj.events.length; e++) {

          newEvents.push(new LodEvent(baseObj.events[e]));
        }

        //ordena pela data de inicio decrescente (mais novo primeiro)
        newEvents.sort((a, b) => (a.startDate < b.startDate) ? 1 : -1);
        
        this.events = newEvents;
      }
    }
  }
}
