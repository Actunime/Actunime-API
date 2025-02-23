import { PersonModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IPerson, IPatchType, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { PersonPaginationBody, IAdd_Person_ZOD, ICreate_Person_ZOD } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import { PatchControllers } from "./patch";
import DeepDiff from 'deep-diff';
import { genPublicID } from "@actunime/utils";

type IPersonDoc = (Document<unknown, unknown, IPerson> & IPerson & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null

interface IPersonResponse extends IPerson {
    parsedPerson: () => Partial<IPerson> | null
}

type IPersonControlled = IPersonDoc & IPersonResponse

interface PersonPatchParams {
    mediaId?: string;
    refId: string,
    pathId?: string,
    description?: string,
    type: IPatchType
}

class PersonController extends UtilControllers.withUser {
    private session: ClientSession | null = null;

    constructor(session: ClientSession | null, user?: IUser) {
        super(user);
        this.session = session;
    }

    parse(Person: Partial<IPerson>) {
        delete Person._id;

        return Person;
    }

    warpper(data: IPersonDoc): IPersonControlled {
        if (!data)
            throw new APIError("Aucun utilisateur n'a été trouvé", "NOT_FOUND");

        const res = data as IPersonControlled;
        res.parsedPerson = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        const res = await PersonModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof PersonPaginationBody>, options?: { onlyVerified: boolean }) {
        const pagination = new PaginationControllers(PersonModel);

        pagination.useFilter(pageFilter, options?.onlyVerified);

        const res = await pagination.getResults();

        return res;
    }

    // Création d'un person
    private async create(data: Partial<IPerson>) {
        this.needUser(this.user);

        const res = new PersonModel(data);
        await res.save({ session: this.session });
        return this.warpper(res);
    }

    // Création avec patch (public)
    public async create_patch(data: Partial<IPerson>, params: PersonPatchParams) {
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
            targetPath: "Person",
            status: isModerator ? "ACCEPTED" : "PENDING",
            original: res.toJSON(),
            changes,
            description: params.description,
            ref: params.refId ? { id: params.refId } : undefined,
            moderator: isModerator ? { id: this.user.id } : undefined
        });
        return res;
    }

    async parseZOD(input: Partial<ICreate_Person_ZOD>, params: PersonPatchParams) {
        // Médias attachées
        const { avatar, ...rawInput } = input;
        const person: Partial<IPerson> = { ...rawInput };


        return person;
    }


    async create_relation(person: IAdd_Person_ZOD, params: PersonPatchParams) {
        if (!person.id && !person.newPerson)
            throw new APIError("Le person est obligatoire", "BAD_ENTRY");
        if (person.id && person.newPerson)
            throw new APIError("Faites un choix... vous ne pouvez pas assigner un nouveau person et un existant", "BAD_ENTRY");

        if (person.newPerson) {
            const refId = genPublicID(8); // Création d'une référence pour les medias attachées
            const newPerson = await this.parseZOD(person.newPerson, { ...params, refId });
            const res = await this.create_patch(newPerson, { ...params, pathId: refId }); // forcé le patch a prendre la ref comme id, comme ça les médias attachées seront bien lié;
            return { id: res.id };
        }

        const res = await this.getById(person.id!);
        return { id: res.id };
    }

    private async delete(id: string) {
        const res = await PersonModel.findOneAndDelete({ id }, { session: this.session });
        return this.warpper(res);
    }

    private async update(id: string, data: Partial<IPerson>) {
        const res = await PersonModel.findOneAndUpdate({ id }, data, { session: this.session });
        return this.warpper(res);
    }
}

export { PersonController };