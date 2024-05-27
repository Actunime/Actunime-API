import { IUserRoles, userPermissionIsHigherThan } from "../_utils/userUtil";
export async function RestrictedAPIRoute<T>(
  roles: IUserRoles | IUserRoles[],
  onBlock: () => any,
  next: (user: any) => T | Promise<T>
) {
  // const session = await auth();
  // const session = await auth();

  // if (!session) {
  //   return onBlock();
  // }

  // if (userPermissionIsHigherThan(session.user.roles, roles)) {
  //   return next(session.user);
  // }

  // return onBlock();

  return next({});
}
