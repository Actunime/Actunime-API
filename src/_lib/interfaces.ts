import { ClientSession } from 'mongoose';
import { IUser } from '../_types/userType';

export type DataOptions = {
  user: IUser;
  note?: string;
  session?: ClientSession;
};

export type GetRouter = {
  Params: { id: string };
  Querystring: { withMedia: string };
};

export type FilterRouter = {
  Querystring: { pagination?: string };
};
