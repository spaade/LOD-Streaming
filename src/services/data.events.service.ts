import { Injectable } from '@angular/core';
import { API, Auth } from 'aws-amplify';
import {LodEvent} from '../models/lodEvent.model';


@Injectable({
  providedIn: 'root'
})
export class DataEventsService {

  event: LodEvent;

  events = [];

  flagLoadingData = false;

  selectedEventId: string = null;

  enableCache = false;

  get selectedEvent() {

    if (!this.selectedEventId) {

      return null;

    } else {

      let obj = this.events.find(c => c.id == this.selectedEventId);

      if (!obj) this.selectedEventId = null;

      return obj;
    }
  }

  selectEvent(event) {

    if (event && event.id) {

      this.selectedEventId = event.id;

    } else {

      this.selectedEventId = event;
    }

    return this.selectedEvent;  // this triggers id validation on get
  }

  async getEvent(companyId, id) {

    return new Promise((resolve, reject) => {

      this.flagLoadingData = true;

      try {

        API
          .get('lodEventsApi', `/events/${ companyId }/${ id }`, {})
          .then((response) => {

            // add msg to ui
            this.event = response;

            this.flagLoadingData = false;

            resolve(response);

          });

      } catch (error) {

        reject(resolve);

        throw new Error(`Event load error: ${ error }`);
      }

    });
  }

  async getEvents(companyId) {

    return new Promise((resolve, reject) => {

      this.flagLoadingData = true;

      this.events = [];

      try {

        API
          .get('lodEventsApi', `/events/${ companyId }`, {})
          .then((response) => {

            // add msg to ui
            this.events = response;

            this.flagLoadingData = false;

            resolve(response);
          });

      } catch (error) {

        reject(resolve);

        throw new Error(`Event load error: ${ error }`);
      }

    });
  }

  async getEventDetails(companyId, eventId) {

    return new Promise((resolve, reject) => {

      let cached = null;

      if (this.enableCache) {

        try {

          cached = JSON.parse(window.localStorage.getItem(`event-${ companyId }-${ eventId }`));
        } catch(err) { cached = null; }
      }

      if (!cached) {

        API
        .get('lodEventsApi', `/events/details/${ companyId }/${ eventId }`, {})
        .then((response) => {

          if (response && !response.error) {

            if (this.enableCache) {
              try {
                window.localStorage.setItem(`event-${ companyId }-${ eventId }`, JSON.stringify(response));
              } catch(err) {}
            }

            resolve(response);

          } else {

            console.log('events load error:', response?.error);

            reject(response);
          }

        });

      } else {

        resolve(cached);
      }
    });
  }

  async saveEvent(event) : Promise<any> {

    return new Promise(async (resolve, reject) => {

      let token = (await Auth.currentSession()).getIdToken().getJwtToken();

      const opts = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        response: false,
        body: event
      };

      API
      .put('lodEventsApi', '/events', opts)
      .then((response) => {

        if(!response.error) {

          console.log('Salvou', response);

          let itemIdx = this.events.findIndex(c => c.id == response.id);

          if (itemIdx == -1) {

            this.events.push(response);

          } else {

            this.events[itemIdx] == response;
          }

          resolve(response);

        } else {

          console.log('events put error:', response.error);

          reject(response);
        }
      });
    });
  }
}
