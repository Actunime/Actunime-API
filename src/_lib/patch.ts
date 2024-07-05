import { ClientSession } from 'mongoose';
import { PatchModel } from '../_models';
import { IPatch } from '../_types/patchType';
import { IUser } from '../_types/userType';

class PatchManager {
  public session: ClientSession;
  public user: IUser;

  constructor(session: ClientSession, user: IUser) {
    this.user = user;
    this.session = session;
  }

  async PatchCreate(args: Partial<IPatch>) {
    const newPatch = new PatchModel(args);
    await newPatch.save({ session: this.session });
  }
}

export { PatchManager };
