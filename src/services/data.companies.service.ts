import { Injectable } from '@angular/core';
import { API, Auth } from 'aws-amplify';
import {LodCompany} from '../models/lodCompany.model';

@Injectable({
  providedIn: 'root'
})
export class DataCompaniesService {

  company: LodCompany;

  companies = [];

  flagLoadingData = false;

  selectedCompanyId: string = null;

  enableCache = false;

  get selectedCompany() {

    if (!this.selectedCompanyId) {

      return null;

    } else {

      let obj = this.companies.find(c => c.id == this.selectedCompanyId);

      if (!obj) this.selectedCompanyId = null;

      return obj;
    }
  }

  selectCompany(company) {

    if (company && company.id) {

      this.selectedCompanyId = company.id;

    } else {

      this.selectedCompanyId = company;
    }

    return this.selectedCompany;  // this triggers id validation on get
  }

  async getCompany(id) {

    return new Promise((resolve, reject) => {

      this.flagLoadingData = true;

      try {

        API
          .get('lodCompaniesApi', `/companies/${ id }`, {})
          .then((response) => {

            //add msg to ui
            this.company = response;

            this.flagLoadingData = false;

            resolve(response);
          });

      } catch (error) {

        reject(resolve)

        throw new Error(`Company load error: ${ error }`)
      }

    });
  }

  async getCompanies() {

    return new Promise((resolve, reject) => {

      this.flagLoadingData = true;

      this.companies = [];

      try {

        API
          .get('lodCompaniesApi', '/companies', {})
          .then((response) => {

            //add msg to ui
            this.companies = response

            this.flagLoadingData = false;

            resolve(response);
          });

      } catch (error) {

        reject(resolve);

        throw new Error(`Companies load error: ${ error }`);
      }

    });
  }

  async getCompanyDetails(companyId): Promise<LodCompany> {

    return new Promise((resolve, reject) => {

      let cached = null;

      if (this.enableCache) {

        try {
          cached = JSON.parse(window.localStorage.getItem(`company-${ companyId }`));
        } catch(err) { cached = null; }
      }

      if (!cached) {

        API
        .get('lodCompaniesApi', `/companies/details/${ companyId }`, {})
        .then((response) => {

          if (!response.error) {

            if (this.enableCache) {
              try {
                window.localStorage.setItem(`company-${ response.id }`, JSON.stringify(response));
              } catch(err) {}
            }

            resolve(new LodCompany(response));

          } else {

            console.log('companies load error:', response?.error);

            reject(response);
          }

        });

      } else {

        resolve(cached);
      }
    });
  }

  async saveCompany(company) : Promise<any> {

    return new Promise(async (resolve, reject) => {

      let token = (await Auth.currentSession()).getIdToken().getJwtToken();

      const opts = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        response: false,
        body: company
      };

      API
      .put('lodCompaniesApi', '/companies', opts)
      .then((response) => {

        if(!response.error) {

          console.log('Salvou', response);

          let itemIdx = this.companies.findIndex(c => c.id == response.id);

          if (itemIdx == -1) {

            this.companies.push(response);

          } else {

            this.companies[itemIdx] == response;
          }

          resolve(response);

        } else {

          console.log('companies put error:', response.error);

          reject(response);
        }
      });
    });
  }
}
