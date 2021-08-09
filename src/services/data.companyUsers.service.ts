import { Injectable } from '@angular/core';
import { API, Auth } from 'aws-amplify';
import {LodCompanyUser} from '../models/lodCompanyUser.model';


@Injectable({
  providedIn: 'root'
})
export class DataCompanyUsersService {

  companyUser: LodCompanyUser;

  companyUsers = [];

  flagLoadingData = false;

  async getCompanyUser(companyId, id) {

    return new Promise((resolve, reject) => {

      this.flagLoadingData = true;

      try {

        API
          .get('lodCompanyUsersApi', `/companyUsers/${ companyId }/${ id }`, {})
          .then((response) => {

            //add msg to ui
            this.companyUser = response

            this.flagLoadingData = false;

            resolve(response);
          });

      } catch (error) {

        reject(resolve);

        throw new Error(`CompanyUsers load error: ${ error }`);
      }

    });
  }

  async getCompanyUsers(company) {

    return new Promise((resolve, reject) => {

      this.flagLoadingData = true;

      this.companyUsers = [];

      try {

        API
          .get('lodCompanyUsersApi', `/companyUsers/${ company }`, {})
          .then((response) => {

            //add msg to ui
            this.companyUsers = response;

            this.flagLoadingData = false;

            resolve(response);
          });

      } catch (error) {

        reject(resolve);

        throw new Error(`CompanyUsers load error: ${ error }`);
      }

    });
  }

  async saveCompanyUser(companyUser) : Promise<any> {

    return new Promise(async (resolve, reject) => {

      let opts = { response: false, body: companyUser };

      try {

        //we may not be logged for this post
        let token = (await Auth.currentSession()).getIdToken().getJwtToken();

        opts['headers'] = { Authorization: `Bearer ${ token }` };

      } catch(err) {}

      API
      .put('lodCompanyUsersApi', '/companyUsers', opts)
      .then((response) => {

        if(!response.error) {

          console.log('Salvou', response);

          let itemIdx = this.companyUsers.find(c => c.id == response.id);

          if (itemIdx == -1) {

            this.companyUsers.push(response);

          } else {

            this.companyUsers[itemIdx] == response;
          }

          resolve(response);

        } else {

          console.log('companyUsers put error:', response.error);

          reject(response);
        }
      });
    });
  }
}
