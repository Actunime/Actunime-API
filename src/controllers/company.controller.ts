import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { ICompany, ITargetPath, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { CompanyPaginationBody, ICompanyBody, IMediaDeleteBody } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import DeepDiff from 'deep-diff';
import { DevLog } from "../_lib/logger";
import { genPublicID } from "@actunime/utils";
import { ImageController } from "./image.controller";
import LogSession from "../_utils/_logSession";
import { PatchController } from "./patch.controllers";
import { CompanyModel } from "../_lib/models";

type ICompanyDoc = (Document<unknown, unknown, ICompany> & ICompany & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface ICompanyResponse extends ICompany {
    parsedCompany: () => Partial<ICompany> | null
}

type ICompanyControlled = ICompanyDoc & ICompanyResponse

interface CompanyParams {
    refId: string,
    description?: string,
}

class CompanyController extends UtilControllers.withUser {
    private patchController: PatchController;
    private targetPath: ITargetPath = "Company";

    constructor(session?: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super({ session, ...options });
        this.patchController = new PatchController(session, options);
    }


    parse(Company: Partial<ICompany>) {
        // delete Company._id;

        return Company;
    }

    warpper(data: ICompanyDoc): ICompanyControlled {
        if (!data)
            throw new APIError("Aucune société n'a été trouvé", "NOT_FOUND");

        const res = data as ICompanyControlled;
        res.parsedCompany = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        DevLog(`Récupération de la société ID: ${id}`, "debug");
        const promise = CompanyModel.findOne({ id });
        if (this.session) promise.session(this.session); else promise.cache("60m");
        const res = await promise;
        DevLog(`Société ${res ? "trouvée" : "non trouvée"}, ID Société: ${id}`, "debug");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof CompanyPaginationBody>) {
        DevLog("Filtrage des societes...", "debug");
        const pagination = new PaginationControllers(CompanyModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        DevLog(`Societes trouvées: ${res.resultsCount}`, "debug");
        return res;
    }
    async build(input: ICompanyBody, params: { refId: string, isRequest: boolean, companyId?: string }) {
        const { logo, ...rawCompany } = input;
        const company: Partial<ICompany> & { id: string } = {
            ...rawCompany,
            id: params.companyId || genPublicID(8)
        };
        const user = this.user;
        this.needUser(user);
        const session = this.session;
        const { refId, isRequest } = params;

        DevLog(`Build d'une société...`, "debug");

        if (logo && (logo.id || logo.newImage)) {
            DevLog(`Ajout de l'image a a la societé... ${logo.id ? `ID: ${logo.id}` : `Nouvelle image: ${JSON.stringify(logo.newImage)}`}`, "debug");
            const imageController = new ImageController(session, { log: this.log, user });
            const getImage = logo.id ? await imageController.getById(logo.id) :
                isRequest ?
                    await imageController.create_request(logo.newImage!, { refId, target: { id: company.id }, targetPath: "Company" }) :
                    await imageController.create(logo.newImage!, { refId, target: { id: company.id }, targetPath: "Company" })
            DevLog(`Ajout de l'image a la société...`, "debug");
            company.logo = { id: getImage.id };
        }

        return new CompanyModel(company);
    }

    public async create(data: ICompanyBody, params: CompanyParams) {
        DevLog(`Création d'une société...`, "debug");
        this.needUser(this.user);
        const patchID = genPublicID(8);
        const res = await this.build(data, { refId: patchID, isRequest: false });
        res.isVerified = true;

        await this.patchController.create({
            id: patchID,
            ...params.refId && { ref: { id: params.refId } },
            type: "CREATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: this.targetPath,
            original: res.toJSON(),
            status: "ACCEPTED",
            description: params.description,
            moderator: { id: this.user.id }
        });

        await res.save({ session: this.session });

        this.log?.add("Création d'une société (studio, production, etc)", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: patchID },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Société crée, ID Société: ${res.id}`, "debug");
        return this.warpper(res);
    }


    public async update(id: string, data: ICompanyBody, params: Omit<CompanyParams, "refId">) {
        DevLog(`Mise à jour d'une societe...`, "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        // Mettre un warning coté client pour prévenir au cas ou il y a des mise a jour en attente de validation avant de faire une modif
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: false, companyId: media.id });
        res._id = media._id;

        await this.patchController.create({
            id: refId,
            type: "UPDATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: this.targetPath,
            original: media.toJSON(),
            changes: DeepDiff.diff(media, res, {
                prefilter: (_, key) => (["__v", "_id", "id"].includes(key) ? false : true)
            }),
            status: "ACCEPTED",
            description: params.description,
            moderator: { id: this.user.id }
        });

        await media.updateOne(res).session(this.session);

        this.log?.add("Modification d'une société (studio, production, etc)", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Société mise à jour, ID Société: ${res.id}`, "debug");
        return this.warpper(res);
    }

    public async delete(id: string, params: IMediaDeleteBody) {
        DevLog(`Suppression d'une societe...`, "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        const deleted = await media.deleteOne().session(this.session);
        const refId = genPublicID(8);
        if (deleted.deletedCount > 0) {
            await this.patchController.create({
                id: refId,
                type: "DELETE",
                author: { id: this.user.id },
                target: { id: media.id },
                targetPath: this.targetPath,
                original: media.toJSON(),
                status: "ACCEPTED",
                reason: params.reason,
                moderator: { id: this.user.id }
            });

            this.log?.add("Suppresion d'une société (studio, production, etc)", [
                { name: "Nom", content: media.name },
                { name: "ID", content: media.id },
                { name: "Raison", content: params.reason },
                { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
            ])

            DevLog(`Société supprimé, ID Société: ${media.id}, ID Maj: ${refId}`, "debug");
            return true;
        }

        DevLog(`Société non supprimé, ID Société: ${media.id}`, "debug");
        return false;
    }

    public async verify(id: string) {
        DevLog("Verification de la societe...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        media.isVerified = true;
        await media.save({ session: this.session });
        DevLog(`Société verifiée, ID Société: ${media.id}`, "debug");
        return this.warpper(media);
    }

    public async unverify(id: string) {
        DevLog("Verification de la societe...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        media.isVerified = false;
        await media.save({ session: this.session });
        DevLog(`Société non verifiée, ID Société: ${media.id}`, "debug");
        return this.warpper(media);
    }

    public async create_request(data: ICompanyBody, params: CompanyParams) {
        DevLog("Demande de creation de societe...", "debug");
        this.needUser(this.user);
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: true });
        res.isVerified = false;

        await this.patchController.create({
            id: refId,
            type: "CREATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Company",
            original: res.toJSON(),
            status: "PENDING",
            description: params.description
        });

        await res.save({ session: this.session });

        this.log?.add("Demande de création d'une société (studio, production, etc)", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Société crée, Demande crée... ID Société: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }

    public async update_request(id: string, data: ICompanyBody, params: CompanyParams) {
        DevLog("Demande de modification de societe...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        // Mettre un warning coté client pour prévenir au cas ou il y a des mise a jour en attente de validation avant de faire une modif
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: true, companyId: media.id });
        res._id = media._id;

        await this.patchController.create({
            id: refId,
            type: "UPDATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Company",
            original: media.toJSON(),
            changes: DeepDiff.diff(media, res, {
                prefilter: (_, key) => (["__v", "_id", "id"].includes(key) ? false : true)
            }),
            status: "PENDING",
            description: params.description
        });


        this.log?.add("Demande de modification d'une société (studio, production, etc)", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Demande crée... ID Société: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }
}

export { CompanyController };