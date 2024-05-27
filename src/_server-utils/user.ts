import { UserModel } from "../_models/_userModel";

export const PublicUserProjection = {
  _id: 1,
  id: 1,
  username: 1,
  displayName: 1,
  roles: 1,
  premium: 1,
  disabled: 1,
  updatedAt: 1,
  createdAt: 1,
};

export async function getUserByPublicId(id: string, lean?: boolean) {
  return await UserModel.findOne({ id }, null, { lean });
}