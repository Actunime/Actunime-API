import { UserModel } from "@actunime/mongoose-models";
import { ClientSession, Document, ObjectId, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IUser } from "@actunime/types";
import { UtilControllers } from "../_utils/_controllers";
import LogSession from "../_utils/_logSession";
import { IUserMutationBody } from "@actunime/validations";
import { ImageController } from "./image.controller";

type IUserDoc = (Document<unknown, {}, IUser> & IUser & { _id: import("mongoose").Types.ObjectId; } & { __v: number; }) | null

interface IUserResponse extends IUser {
    parsedUser: () => Partial<IUser> | null
}

type IUserControlled = IUserDoc & IUserResponse

class UserController extends UtilControllers.withUser {
    private session: (ClientSession | null) = null;
    private log?: LogSession;

    constructor(session: ClientSession | null = null, options?: { logSession?: LogSession, user?: IUser }) {
        super(options?.user);
        this.session = session;
        this.log = options?.logSession;
    }


    parse(user: Partial<IUser & { _id: any }>) {
        delete user._id;
        return user;
    }

    warpper(data: IUserDoc): IUserControlled | null {
        if (!data)
            return null;

        const res = data as IUserControlled;
        res.parsedUser = this.parse.bind(this, data)

        return res;
    }

    async build(input: IUserMutationBody, defInput: { username: string, accountId: string }, { refId, description }: { refId: string, description?: string }) {
        const { avatar, banner, ...rawUser } = input;
        const userData: Partial<IUser> = {
            ...rawUser,
            ...defInput,
        };

        let user: IUserDoc | null = null;

        if (this.user) {
            const getUser = await this.getById(this.user.id);
            if (getUser) {
                user = getUser;
                user.isNew = false;
            }
        }

        if (!user && defInput.username) {
            const getUser = await this.getByUsername(defInput.username);
            if (getUser) {
                user = getUser;
                user.isNew = false;
            }
        }

        if (!user) {
            user = await this.genNewUser(userData);
            user.isNew = true;
        }

        this.needUser(user);

        if (avatar || banner) {
            const imageController = new ImageController(this.session, { log: this.log, user });

            if (avatar)
                user.avatar = await imageController.create_relation(avatar, {
                    refId,
                    description,
                    type: "UPDATE",
                    targetPath: "User"
                });

            if (banner)
                user.banner = await imageController.create_relation(banner, {
                    refId,
                    description,
                    type: "UPDATE",
                    targetPath: "User"
                });
        }

        user.set(userData);

        return user;
    }

    async getById(id: string) {
        const res = await UserModel.findOne({ id }).cache("10s");
        return this.warpper(res);
    }

    async getByUsername(username: string) {
        const res = await UserModel.findOne({ username }).cache("10s");
        return this.warpper(res);
    }

    async getByAccountId(id: string) {
        const res = await UserModel.findOne({ accountId: id }).cache("10s");
        return this.warpper(res);
    }

    async genNewUser(data: Partial<IUser>) {
        const newUser = new UserModel(data);
        return newUser;
    }

    async updateUser(id: string, data: Partial<IUser>) {
        await UserModel.updateOne({ id }, data).session(this.session);
    }
}

export { UserController };