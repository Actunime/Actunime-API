import { EmailCodeModel } from "@actunime/mongoose-models";
import { ClientSession, Document } from "mongoose";
import { APIError } from "../_lib/Error";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { MailTransport } from "../_utils/_nodemailer";
import { IEmailCode } from "@actunime/types";
import { genPublicID } from "@actunime/utils";

type IEmailCodeDoc = (Document<unknown, unknown, IEmailCode> & IEmailCode & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}) | null;

interface IEmailCodeResponse extends IEmailCode {
    parsedEmailCode: () => Partial<IEmailCode> | null
    sendResetPasswordEmail: () => Promise<void>
    useCode: () => Promise<boolean>
}

type IEmailCodeControlled = IEmailCodeDoc & IEmailCodeResponse

class Email {
    private model: typeof EmailCodeModel;
    private session: ClientSession | null = null;

    constructor(model: typeof EmailCodeModel) { this.model = model; }
    useSession(session: ClientSession) {
        this.session = session;
        return this;
    }

    parse(doc: Partial<IEmailCode>) {
        return doc;
    }

    warpper(data: IEmailCodeDoc, errMessage?: string): IEmailCodeControlled {
        if (!data)
            throw new APIError(errMessage || "Code incorrecte ou expiré", "NOT_FOUND");

        const res = data as IEmailCodeControlled;
        res.parsedEmailCode = this.parse.bind(this, data)
        res.sendResetPasswordEmail = this.sendResetPasswordEmail.bind(this, data.email, data.code, data.device)
        res.useCode = this.useCode.bind(this, data.code)
        return res;
    }


    async getById(id: string) {
        const res = await this.model.findOne({ id }).cache("1m");
        return this.warpper(res);
    }

    async getByEmail(email: string, noWarp?: boolean) {
        const res = await this.model.findOne({ email }).cache("1m");
        return noWarp ? res : this.warpper(res);
    }

    async getByEmailAndCode(email: string, code: string) {
        const res = await this.model.findOne({ code, email }).cache("1m");
        return this.warpper(res);
    }

    async useCode(code: string) {
        const res = await this.model.findOne({ code });
        const deleted = await res?.deleteOne();

        if (deleted)
            return deleted?.deletedCount > 0

        return false;
    }

    genCode() {
        return genPublicID(6, true);
    }

    async createEmailCode(email: string, accountId: string) {
        const code = this.genCode();
        const res = await this.model.create({ email, code, accountId });
        return this.warpper(res);
    }

    async sendRegisterEmail(email: string, code: string, device: string) {
        let data: SMTPTransport.SentMessageInfo;
        try {
            data = await MailTransport.sendMail({
                to: email,
                from: process.env.EMAIL_FROM,
                subject: "Inscription | Actunime",
                text: `Votre code pour valider votre inscription est ${code}`,
                html: `<p>Votre code pour valider votre inscription est <b>${code}</b> <br/> <br/>Si vous n'avez pas demandé ce code, veuillez ignorer ce message. <br/> Tantative de connexion depuis ${device}</p>`,
            })
        } catch {
            throw new APIError("Le mail n'a pas pu être envoyé, veuillez ressayer...", "SERVER_ERROR")
        }

        if (!data?.accepted?.length)
            throw new APIError("Le mail n'a pas pu être envoyé, veuillez ressayer...", "SERVER_ERROR")
    }

    async sendResetPasswordEmail(email: string, code: string, device: string) {
        let data: SMTPTransport.SentMessageInfo;
        try {
            data = await MailTransport.sendMail({
                to: email,
                from: process.env.EMAIL_FROM,
                subject: "Réinitialisation de mot de passe | Actunime",
                text: `Votre code pour réinitialiser votre mot de passe est ${code}`,
                html: `<p>Votre code pour réinitialiser votre mot de passe est <b>${code}</b> <br/> <br/>Si vous n'avez pas demandé ce code, veuillez ignorer ce message. <br/> Tantative de connexion depuis ${device}</p>`,
            })
        } catch {
            throw new APIError("Le mail n'a pas pu être envoyé, veuillez ressayer...", "SERVER_ERROR")
        }

        if (!data?.accepted?.length)
            throw new APIError("Le mail n'a pas pu être envoyé, veuillez ressayer...", "SERVER_ERROR")
    }
}

export const EmailCodeControllers = new Email(EmailCodeModel);