import { IUser, IUserRoles, userPermissionIsHigherThan } from "@actunime/types";
import { APIError } from "../_lib/Error";



export class withUser {
    public user: IUser | null = null;
    constructor(user?: IUser | null) { this.user = user || null; }
    public useUser(user: IUser) {
        this.user = user;
        return this;
    }

    public needUser(user: IUser | null): asserts user is IUser {
        if (!this.user)
            throw new APIError("Aucun n'utilisateur n'a été défini pour cette action", "NOT_FOUND");
    }

    public needRoles(roles: IUserRoles[], strict: boolean = false) {
        this.needUser(this.user);
        console.info("User roles", this.user.roles);
        if (strict)
            if (!roles.every(role => this.user?.roles.includes(role)))
                throw new APIError("Vous n'avez pas les permissions pour effectuer cette action", "UNAUTHORIZED");
            else
                if (!roles.some(role => this.user?.roles.includes(role)))
                    throw new APIError("Vous n'avez pas les permissions pour effectuer cette action", "UNAUTHORIZED");
    }
}

export const UtilControllers = { withUser }