
export class LodStreamChatMsg {

  id: string;
  streamId: string;
  userId: string;
  userAlias: string;

  msgDate: number;
  text: string;
  isLoggedUser: boolean;
  isAdmin: boolean;

  constructor(srcObj?: any) {

    this.msgDate = new Date().getTime();

    if (srcObj) {
      Object.assign(this, srcObj);
    }
  }
}