import { IUser, IUserRoles, userPermissionIsHigherThan } from "@actunime/types";
import { APIError } from "../_lib/Error";
import { CheckRealmRoles } from "./_realmRoles";
import { ClientSession } from "mongoose";
import LogSession from "./_logSession";

export class withBasic {
    public session: ClientSession | null = null;
    public log?: LogSession;
    constructor(session: ClientSession | null = null, log?: LogSession) {
        this.session = session;
        this.log = log;
    }
    public useSession(session: ClientSession | null) {
        this.session = session;
        return this;
    }
    public useLog(log: LogSession | undefined) {
        this.log = log;
        return this;
    }
}

export class withUser extends withBasic {
    public user: IUser | null = null;
    constructor(user?: IUser | null) {
        super();
        this.user = user || null;
    }
    public useUser(user: IUser) {
        this.user = user;
        return this;
    }

    public needUser(user: IUser | null): asserts user is IUser {
        if (!this.user)
            throw new APIError("Aucun n'utilisateur n'a été défini pour cette action", "NOT_FOUND");
    }

    public needRoles = CheckRealmRoles
}

export const UtilControllers = { withUser }