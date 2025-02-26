import { UserModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IUser } from "@actunime/types";
import { TokenControllers } from "./token.controllers";

type IUserDoc = (Document<unknown, unknown, IUser> & IUser & Required<{ _id: Schema.Types.ObjectId; }> & {
    __v: number;
}) | null;

interface IUserResponse extends IUser {
    parsedUser: () => Partial<IUser> | null
}

type IUserControlled = IUserDoc & IUserResponse

class User {
    private model: typeof UserModel;
    private session: ClientSession | null = null;

    constructor(model: typeof UserModel) { this.model = model; }
    useSession(session: ClientSession) {
        this.session = session;
        return this;
    }

    parse(user: Partial<IUser>) {
        delete user._id;
        return user;
    }

    warpper(data: IUserDoc): IUserControlled {
        if (!data)
            throw new APIError("Aucun utilisateur n'a été trouvé", "NOT_FOUND");

        const res = data as IUserControlled;
        res.parsedUser = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        const res = await this.model.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async getUserByToken(token: string) {
        const res = await TokenControllers.getByToken(token);
        const user = await this.getById(res.userId);
        return this.warpper(user);
    }
}

export const UserControllers = new User(UserModel);