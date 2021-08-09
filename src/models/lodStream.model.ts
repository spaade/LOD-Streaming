
export class LodStream {

  companyId: string;
  eventId: string;
  id: string;

  streamName: string;
  streamStatus: string;

  enabledFromDate: number;
  enabledToDate: number;

  runningFromDate: number;
  runningToDate: number;

  requiresAgreement: boolean;
  agreementUrl: string;

  streamVimeoUrl: string;
  socialMediaUrl: string;

  constructor(srcObj?: any) {

    if (srcObj) {
      Object.assign(this, srcObj);
    }
  }
}
