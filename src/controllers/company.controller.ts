import { CompanyModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { ICompany, IPatchType, IUser, PatchTypeObj } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { CompanyPaginationBody, IAdd_Company_ZOD, ICreate_Company_ZOD } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import { PatchControllers } from "./patch";
import DeepDiff from 'deep-diff';
import { genPublicID } from "@actunime/utils";
import { ImageController } from "./image.controller";
import LogSession from "../_utils/_logSession";

type ICompanyDoc = (Document<unknown, unknown, ICompany> & ICompany & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface ICompanyResponse extends ICompany {
    parsedCompany: () => Partial<ICompany> | null
}

type ICompanyControlled = ICompanyDoc & ICompanyResponse

interface CompanyPatchParams {
    mediaId?: string;
    refId: string,
    pathId?: string,
    description?: string,
    type: IPatchType
}

class CompanyController extends UtilControllers.withUser {
    private session: ClientSession | null = null;
    private log?: LogSession;

    constructor(session: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super(options?.user);
        this.session = session;
        this.log = options?.log;
    }


    parse(Company: Partial<ICompany>) {
        delete Company._id;

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
        const res = await CompanyModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof CompanyPaginationBody>, options?: { onlyVerified: boolean }) {
        const pagination = new PaginationControllers(CompanyModel);

        pagination.useFilter(pageFilter, options?.onlyVerified);

        const res = await pagination.getResults();

        return res;
    }

    // Création d'un company
    private async create(data: Partial<ICompany>) {
        this.needUser(this.user);

        const res = new CompanyModel(data);
        await res.save({ session: this.session });
        return this.warpper(res);
    }

    // Création avec patch (public)
    public async create_patch(data: Partial<ICompany>, params: CompanyPatchParams) {
        this.needUser(this.user);
        const res = await this.create(data);
        const patch = new PatchControllers(this.session, this.user);
        let changes;

        if (params.type.endsWith("UPDATE")) {
            if (!params.mediaId)
                throw new APIError("Le mediaId est obligatoire", "BAD_ENTRY");

            changes = DeepDiff.diff(res, data, {
                prefilter: (path, key) => {
                    return ["__v", "_id", "id"].includes(key) ? false : true
                }
            });
        }

        const isModerator = params.type.startsWith("MODERATOR") ? true : false;

        if (isModerator)
            this.needRoles(["ANIME_MODERATOR", "MANGA_MODERATOR"]);

        await patch.create({
            id: params.pathId ? params.pathId : undefined,
            type: params.type,
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Company",
            status: isModerator ? "ACCEPTED" : "PENDING",
            original: res.toJSON(),
            changes,
            description: params.description,
            ref: params.refId ? { id: params.refId } : undefined,
            moderator: isModerator ? { id: this.user.id } : undefined
        });

        this.log?.add("Mise a jour | Société", [
            { name: "ID", content: res.id },
            { name: "Nom", content: data.name },
            { name: "MajID", content: params.pathId },
            { name: "RefID", content: params.refId },
            { name: "Description", content: params.description },
            { name: "Type", content: PatchTypeObj[params.type] },
            { name: "Status", content: isModerator ? "Accepté" : "En attente" },
        ])

        return res;
    }

    async parseZOD(input: Partial<ICreate_Company_ZOD>, params: CompanyPatchParams) {
        this.needUser(this.user);
        // Médias attachées
        const { logo, ...rawInput } = input;
        const company: Partial<ICompany> = { ...rawInput };

        if (logo)
            company.logo = await new ImageController(this.session, { log: this.log, user: this.user })
                .create_relation(logo, { ...params, targetPath: "Company" });

        return company;
    }


    async create_relation(company: IAdd_Company_ZOD, params: CompanyPatchParams) {
        if (!company.id && !company.newCompany)
            throw new APIError("Le company est obligatoire", "BAD_ENTRY");
        if (company.id && company.newCompany)
            throw new APIError("Faites un choix... vous ne pouvez pas assigner un nouveau company et un existant", "BAD_ENTRY");

        if (company.newCompany) {
            const refId = genPublicID(8); // Création d'une référence pour les medias attachées
            const newCompany = await this.parseZOD(company.newCompany, { ...params, refId });
            const res = await this.create_patch(newCompany, { ...params, pathId: refId }); // forcé le patch a prendre la ref comme id, comme ça les médias attachées seront bien lié;
            return { id: res.id };
        }

        const res = await this.getById(company.id!);
        return { id: res.id };
    }

    private async delete(id: string) {
        const res = await CompanyModel.findOneAndDelete({ id }, { session: this.session });
        return this.warpper(res);
    }

    private async update(id: string, data: Partial<ICompany>) {
        const res = await CompanyModel.findOneAndUpdate({ id }, data, { session: this.session });
        return this.warpper(res);
    }
}

export { CompanyController };