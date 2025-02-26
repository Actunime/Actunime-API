import { AccessTokenModel } from "@actunime/mongoose-models";
import { IAccessToken } from "@actunime/types";
import { ClientSession, Document } from "mongoose";
import jwt from "jsonwebtoken";
import { APIError } from "../_lib/Error";

interface IParsedToken {
    access_token: string,
    refresh_token: string,
    iat: number,
    exp: number
}

type ITokenDoc = (Document<unknown, unknown, IAccessToken> & IAccessToken & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}) | null;

interface ITokenResponse extends IAccessToken {
    parsedToken: () => IParsedToken | null
    verifyToken: (options: { auto_delete: boolean, trigger_invalid: boolean }) => Promise<boolean>
    verifyRefreshToken: (options: { auto_delete: boolean, trigger_invalid: boolean }) => Promise<boolean>
}

type ITokenControlled = ITokenDoc & ITokenResponse

class Token {
    private model: typeof AccessTokenModel;
    private session: ClientSession | null = null;

    constructor(model: typeof AccessTokenModel) { this.model = model; }
    useSession(session: ClientSession) {
        this.session = session;
        return this;
    }

    parse(doc: ITokenDoc): IParsedToken | null {
        if (!doc)
            return null;

        const iat = new Date(doc.createdAt).getTime();
        const exp = iat + (60 * 60 * 1000); // 1h
        return {
            access_token: doc.token,
            refresh_token: doc.refreshToken,
            iat,
            exp
        }
    }

    warpper(data: ITokenDoc): ITokenControlled {
        if (!data)
            throw new APIError("Jeton invalide ou expiré", "NOT_FOUND");

        const res = data as ITokenControlled;
        res.parsedToken = this.parse.bind(this, data)
        res.verifyToken = this.jwtIsValid.bind(this, data.token)
        res.verifyRefreshToken = this.jwtIsValid.bind(this, data.refreshToken)

        return res;
    }

    async getById(id: string) {
        const res = await this.model.findOne({ id }).cache("1m");
        return this.warpper(res);
    }

    async getByToken(token: string) {
        const res = await this.model.findOne({ token }).cache("60m");
        return this.warpper(res);
    }

    async createAccesToken({ clientId, userId, device }: Omit<IAccessToken, "token" | "refreshToken" | "lastActivity" | "createdAt">) {
        const newAccesToken = new this.model({
            clientId,
            userId,
            device,
            token: jwt.sign({ clientId, userId }, process.env.TOKEN_SECRET as string, { expiresIn: "1h" }),
            refreshToken: jwt.sign({ clientId, userId }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: "7d" }),
        });
        await newAccesToken.save({ session: this.session });

        return this.warpper(newAccesToken);
    }

    async deleteAccesToken(token: string) {
        const deleted = await this.model
            .deleteOne({ token })
            .session(this.session);
        return deleted.deletedCount > 0;
    }

    async jwtIsValid(token: string, options: { auto_delete: boolean, trigger_invalid: boolean }) {
        const isValid = await new Promise((resolve: (value: boolean) => void, reject) => {
            jwt.verify(token, process.env.TOKEN_SECRET as string,
                async (err) => {
                    if (err) {
                        if (options.auto_delete)
                            await this.deleteAccesToken(token)
                        if (options.trigger_invalid)
                            reject(new APIError("Jeton invalide ou expiré", "NOT_FOUND"))
                        else
                            resolve(false)
                    }
                    resolve(true)
                }
            );
        })
        return isValid;
    }


    async getTokenByRefreshToken(refreshToken: string) {
        const res = await this.model.findOne({ refreshToken }).cache("1m");
        return this.warpper(res);
    }

    async getNewTokenByRefreshToken(refreshToken: string) {
        const { userId, clientId, device, token, verifyRefreshToken } = await this.getTokenByRefreshToken(refreshToken);
        await verifyRefreshToken({ auto_delete: true, trigger_invalid: true });
        await this.deleteAccesToken(token); // suppression de l'ancien token;

        const newToken = await this.createAccesToken({ userId, clientId, device });

        return this.warpper(newToken);
    }



}

export const TokenControllers = new Token(AccessTokenModel);