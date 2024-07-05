import { Schema, model, models } from 'mongoose';
import type {
  IUser,
  IUserLinkedAccount,
  IUserAuthToken,
  IUserDisabled,
  IUserPremium,
  IUserAccount,
  IUserAccountSession
} from '../_types/userType';
import { genPublicID } from '../_utils/genID';
import { withSchema } from './_mediaModel';

const userLinkedAccountSchema = new Schema<IUserLinkedAccount>(
  {
    providerAccountId: String,
    provider: { type: String },
    type: { type: String }
  },
  { _id: false }
);

const userAccountSessionSchema = new Schema<IUserAccountSession>(
  {
    sessionToken: { type: String },
    accessToken: { type: String },
    expires: { type: Date },
    device: { type: String }
  },
  { _id: false, timestamps: true }
);

const userAccountSchema = new Schema<IUserAccount>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, unique: true },
  linkedAccounts: { type: [userLinkedAccountSchema], default: [] },
  sessions: { type: [userAccountSessionSchema], default: [] },
  verified: { type: Date, default: undefined }
});

export const UserAccountModel = models.UserAccount || model('UserAccount', userAccountSchema);

const userSchema = new Schema<IUser>(
  {
    id: {
      type: String,
      unique: true,
      index: true,
      default: () => genPublicID()
    },
    // account: { type: Schema.Types.ObjectId, ref: "UserAccount", required: true },
    username: { type: String, required: true, unique: true },
    displayName: { type: String },
    bio: { type: String },
    roles: { type: [String], default: ['MEMBER'] },
    image: {
      avatar: { type: String, default: undefined },
      banner: { type: String, default: undefined }
    }
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

userSchema.virtual('disabled', {
  ref: 'UserDisabled',
  localField: 'id',
  foreignField: 'user.id',
  justOne: true
});

// userSchema.virtual("disabled.by.data", {
//   ref: "User",
//   localField: "disabled.by.id",
//   foreignField: "id",
//   justOne: true,
// })

// userSchema.virtual("disabled.user.data", {
//   ref: "User",
//   localField: "disabled.user.id",
//   foreignField: "id",
//   justOne: true,
// })

// userSchema.virtual("premium", {
//   ref: "UserPremium",
//   localField: "id",
//   foreignField: "user.id",
//   justOne: true
// })

export const UserModel = models.User || model('User', userSchema);

// const UserContributions = new Schema({
//   id: {
//     type: String,
//     unique: true,
//     index: true,
//     default: () => genPublicID(),
//   },
//   user: { type: Schema.Types.ObjectId, ref: "User", required: true },
//   contributions: { type: Number, default: 0 },
// })

/**
 *
 * User Disabled
 *
 */

const UserDisabledSchema = new Schema<IUserDisabled>(
  {
    id: {
      type: String,
      unique: true,
      index: true,
      default: () => genPublicID()
    },
    reason: { type: String, required: true },
    user: { type: withSchema, required: true },
    by: { type: withSchema, required: true }
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

UserDisabledSchema.virtual('by.data', {
  ref: 'User',
  localField: 'by.id',
  foreignField: 'id',
  justOne: true
});

UserDisabledSchema.virtual('user.data', {
  ref: 'User',
  localField: 'user.id',
  foreignField: 'id',
  justOne: true
});

export const UserDisabledModel = models.UserDisabled || model('UserDisabled', UserDisabledSchema);

/**
 *
 * User Premium
 *
 */

const UserPremiumSchema = new Schema<IUserPremium>(
  {
    id: {
      type: String,
      unique: true,
      index: true,
      default: () => genPublicID()
    },
    user: { type: withSchema, required: true },
    level: { type: Number, required: true },
    expires: { type: Date, expires: 60 * 60 * 24, required: true }
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

export const UserPremiumModel = models.UserPremium || model('UserPremium', UserPremiumSchema);

/**
 *
 * User Auth Token
 *
 */

const UserAuthTokenSchema = new Schema<IUserAuthToken>(
  {
    identifier: { type: String },
    token: { type: String },
    code: { type: String },
    expires: { type: Date },
    expireAt: { type: Date, expires: 0 },
    uses: { type: Number, default: 0 },
    signup: { type: Boolean, default: false },
    data: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const UserAuthTokenModel =
  models.UserAuthToken || model('UserAuthToken', UserAuthTokenSchema);
