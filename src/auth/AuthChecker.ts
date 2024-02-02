import { type AuthChecker, ResolverData } from "type-graphql";
import { IUserRoles } from "../medias/users/_user.type";
import { ActunimeAuthContext } from "..";

export const authChecker: AuthChecker<ActunimeAuthContext, IUserRoles> = ({ context: ctx }, roles) => {

  if (ctx.logged) {

    if (roles.length === 0)
      return true; // Membres seulements

    return ctx.roles.some((r) => roles.includes(r)) // Rôles spécifiées

  } else {
    return false; // Non autorisé si pas d'utilisateur;
  }

}