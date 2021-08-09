export class LodCompanyUser {

  companyId: string;
  userId: string;

  companyUserName: string;
  companyPassword: string;

  email: string;
  name: string;

  companyRole: string;
  companyBranch: string;
  phoneNumber: string;

  lodStatus: string = 'active';

  lastLogin: number;

  createdDate: number;
  updatedDate: number;
  updatedUserName: string;

  constructor(baseObj?: any){

    if (baseObj) {

      Object.assign(this, baseObj);
    }

  };
}
