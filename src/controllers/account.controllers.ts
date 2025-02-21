import { AccountModel, PreRegisterModel, UserModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import bcrypt from "bcrypt";
import { IInscription_Zod_Schema } from "@actunime/validations";
import { ImageControllers } from "./image.controllers";
import jwt from 'jsonwebtoken';
import { DevLog, genPublicID } from "@actunime/utils";
import { MailTransport } from "../_utils/_nodemailer";
import { IAccount } from "@actunime/types";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { EmailCodeControllers } from "./emailCode.controllers";

type IAccountDoc = (Document<unknown, {}, IAccount> & IAccount & {
    _id: Schema.Types.ObjectId;
} & {
    __v: number;
}) | null

interface IAccountResponse extends IAccount {
    parsedAccount: () => Partial<IAccount> | null
}

type IAccountControlled = IAccountDoc & IAccountResponse

class Account {
    private model: typeof AccountModel;
    private session: ClientSession | null = null;

    constructor(model: typeof AccountModel) { this.model = model; }
    useSession(session: ClientSession) {
        this.session = session;
        return this;
    }

    parse(doc: Partial<IAccount>) {

        return doc
    }

    warpper(data: IAccountDoc, error?: APIError): IAccountControlled {
        if (!data)
            throw error || new APIError("Aucun compte n'a été trouvé", "NOT_FOUND");

        let res = data as IAccountControlled;
        res.parsedAccount = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        const res = await this.model.findOne({ id });
        return this.warpper(res);
    }

    async getByEmail(email: string, error?: APIError) {
        const res = await this.model.findOne({ email });
        return this.warpper(res, error);
    }

    async getByUserId(userId: string) {
        const res = await this.model.findOne({ userId });
        return this.warpper(res);
    }

    async authWithPassword(email: string, password: string) {
        const res = await this.getByEmail(email, new APIError("Email ou mot de passe incorrect", "UNAUTHORIZED", 401));
        console.log(res)
        if (password && res.password) {
            const match = await bcrypt.compare(password, res.password);
            if (!match) {
                DevLog("Authentification avec mot de passe échoué", "error");
                throw new APIError("Email ou mot de passe incorrect", "UNAUTHORIZED", 401);
            }
        } else {
            DevLog("Authentification avec mot de passe échoué 2", "error");
            throw new APIError("Email ou mot de passe incorrect", "UNAUTHORIZED", 401);
        }
        return this.warpper(res);
    }

    async genRegisterCode(data: Omit<IInscription_Zod_Schema, "captcha">, device: string = "") {
        const code = EmailCodeControllers.genCode();
        const email = data.account.email;

        // (Warn) tout est géré par le model PreRegister;

        const findCode = await PreRegisterModel.findOne({ email }).cache("1m");
        if (findCode) {
            if (findCode.createdAt.getTime() + (60 * 5 * 1000) > Date.now())
                throw new APIError("Vous avez déjà une inscription en cours, un email vous a été envoyé, merci de rentrer le code.", "TOO_MANY_REQUESTS");
            await findCode.deleteOne();
        }

        const emailExist = await this.getByEmail(email);
        if (emailExist)
            throw new APIError("Un compte avec cette adresse email existe deja", "BAD_REQUEST");

        const newCode = new PreRegisterModel({
            data,
            code,
            device,
            email
        })

        await EmailCodeControllers.sendRegisterEmail(email, code, device);
        await newCode.save({ session: this.session });
    }


    async verifyRegisterCode(email: string, code: string) {
        const res = await PreRegisterModel.findOne({ code, email }).cache("1m");
        if (!res) throw new APIError("Code incorrect ou expiré", "BAD_REQUEST");
        return res;
    }

    async handleRegisterCode(email: string, code: string) {
        const res = await this.verifyRegisterCode(email, code);
        await res.deleteOne();
        return this.createAccount(res.data);
    }

    async createAccount({ account, user: userData }: Omit<IInscription_Zod_Schema, "captcha">) {
        const { avatar, banner, ...user } = userData;

        const emailExist = await this.getByEmail(account.email);
        if (emailExist)
            throw new APIError("Un compte avec cette adresse email existe deja", "BAD_REQUEST");

        const password = await bcrypt.hash(account.password, 10);
        const newUser = new UserModel(user);
        const newAccount = new this.model({
            ...account,
            password,
            userId: newUser.id,
            user: newUser._id
        });

        try {

            if (avatar?.newImage) {
                const newAvatar = await ImageControllers.createImage(avatar.newImage, {
                    target: "avatar",
                    targetPath: "User"
                });
                newUser.avatar = { id: newAvatar.id }
            }

            if (banner?.newImage) {
                const newBanner = await ImageControllers.createImage(banner.newImage, {
                    target: "banner",
                    targetPath: "User"
                });
                newUser.banner = { id: newBanner.id }
            }

        } catch (err) {
            if (newUser?.avatar?.id)
                ImageControllers.deleteImage(newUser.avatar.id, "User");
            if (newUser?.banner?.id)
                ImageControllers.deleteImage(newUser.banner.id, "User");

            throw new APIError("Une erreur est survenue lors de la sauvegarde de l'image", "SERVER_ERROR", 500);
        }

        await newUser.save({ session: this.session });
        await newAccount.save({ session: this.session });

        return newAccount;
    }

    async genResetPassword(email: string) {
        const account = await this.getByEmail(email);
        const findCode = await EmailCodeControllers.getByEmail(account.email, true)
        if (findCode) {
            if (findCode.createdAt.getTime() + (60 * 5 * 1000) > Date.now())
                throw new APIError("Vous avez déjà une demande de réinitialisation du mot de passe en cours, un email vous a été envoyé, merci de rentrer le code.", "TOO_MANY_REQUESTS");
            await findCode.deleteOne().session(this.session);
        }

        const code = await EmailCodeControllers.createEmailCode(account.email, account.id);
        await code.sendResetPasswordEmail();
    }

    async handleResetPassword(email: string, code: string, newPassword: string) {
        const getCode = await EmailCodeControllers.getByEmailAndCode(email, code);
        const res = await this.getById(getCode.accountId);

        if (newPassword && res.password) {
            const match = await bcrypt.compare(newPassword, res.password);
            if (match) throw new APIError("Vous ne pouvez pas utiliser le même mot de passe", "UNAUTHORIZED");
        }

        const password = await bcrypt.hash(newPassword, 10);

        await getCode.useCode();

        await this.model.updateOne({ email, id: getCode.accountId }, { password }).session(this.session)
    }

    async handleResetPasswordWithPassword(data: { password: string, newPassword: string }, email: string) {
        const auth = await this.authWithPassword(email, data.password);
        if (data.newPassword && auth.password) {
            const match = await bcrypt.compare(data.newPassword, auth.password);
            if (match) throw new APIError("Vous ne pouvez pas utiliser le même mot de passe", "UNAUTHORIZED");
        }

        const password = await bcrypt.hash(data.newPassword, 10);

        await this.model.updateOne({ email, id: auth.id }, { password }).session(this.session)
    }

}

export const AccountControllers = new Account(AccountModel);