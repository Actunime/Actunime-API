import { CharacterModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { ICharacter, IPatchType, IUser, PatchTypeObj } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { CharacterPaginationBody, IAdd_Character_ZOD, ICreate_Character_ZOD } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import { PatchControllers } from "./patch";
import DeepDiff from 'deep-diff';
import { genPublicID } from "@actunime/utils";
import { PersonController } from "./person.controler";
import { ImageController } from "./image.controller";
import LogSession from "../_utils/_logSession";

type ICharacterDoc = (Document<unknown, unknown, ICharacter> & ICharacter & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface ICharacterResponse extends ICharacter {
    parsedCharacter: () => Partial<ICharacter> | null
}

type ICharacterControlled = ICharacterDoc & ICharacterResponse

interface CharacterPatchParams {
    mediaId?: string;
    refId: string,
    pathId?: string,
    description?: string,
    type: IPatchType
}

class CharacterController extends UtilControllers.withUser {
    private session: ClientSession | null = null;
    private log?: LogSession;

    constructor(session: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super(options?.user);
        this.session = session;
        this.log = options?.log;
    }


    parse(Character: Partial<ICharacter>) {
        delete Character._id;

        return Character;
    }

    warpper(data: ICharacterDoc): ICharacterControlled {
        if (!data)
            throw new APIError("Aucun personnage n'a été trouvé", "NOT_FOUND");

        const res = data as ICharacterControlled;
        res.parsedCharacter = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        const res = await CharacterModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof CharacterPaginationBody>) {
        const pagination = new PaginationControllers(CharacterModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        return res;
    }

    // Création d'un character
    private async create(data: Partial<ICharacter>) {
        this.needUser(this.user);

        const res = new CharacterModel(data);
        await res.save({ session: this.session });
        return this.warpper(res);
    }

    // Création avec patch (public)
    public async create_patch(data: Partial<ICharacter>, params: CharacterPatchParams) {
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
            targetPath: "Character",
            status: isModerator ? "ACCEPTED" : "PENDING",
            original: res.toJSON(),
            changes,
            description: params.description,
            ref: params.refId ? { id: params.refId } : undefined,
            moderator: isModerator ? { id: this.user.id } : undefined
        });

        this.log?.add("Mise a jour | Personnage", [
            { name: "ID", content: res.id },
            { name: "Nom", content: data.name?.default },
            { name: "MajID", content: params.pathId },
            { name: "RefID", content: params.refId },
            { name: "Description", content: params.description },
            { name: "Type", content: PatchTypeObj[params.type] },
            { name: "Status", content: isModerator ? "Accepté" : "En attente" },

        ])

        return res;
    }

    async parseZOD(input: Partial<ICreate_Character_ZOD>, params: CharacterPatchParams) {
        this.needUser(this.user);
        // Médias attachées
        const { avatar, actors, ...rawInput } = input;
        const character: Partial<ICharacter> = { ...rawInput };

        if (avatar) {
            character.avatar = await new ImageController(this.session, { log: this.log, user: this.user }).create_relation(avatar,
                { ...params, targetPath: "Character" }
            );
        }

        if (actors && actors.length) {
            const controller = new PersonController(this.session, { log: this.log, user: this.user });
            character.actors = await Promise.all(actors.map((actor) => controller.create_relation(actor, params)));
        }

        return character;
    }


    async create_relation(character: IAdd_Character_ZOD, params: CharacterPatchParams) {
        if (!character.id && !character.newCharacter)
            throw new APIError("Le character est obligatoire", "BAD_ENTRY");
        if (character.id && character.newCharacter)
            throw new APIError("Faites un choix... vous ne pouvez pas assigner un nouveau character et un existant", "BAD_ENTRY");

        if (character.newCharacter) {
            const refId = genPublicID(8); // Création d'une référence pour les medias attachées
            const newCharacter = await this.parseZOD(character.newCharacter, { ...params, refId });
            const res = await this.create_patch(newCharacter, { ...params, pathId: refId }); // forcé le patch a prendre la ref comme id, comme ça les médias attachées seront bien lié;
            return { id: res.id };
        }

        const res = await this.getById(character.id!);
        return { id: res.id };
    }

    private async delete(id: string) {
        const res = await CharacterModel.findOneAndDelete({ id }, { session: this.session });
        return this.warpper(res);
    }

    private async update(id: string, data: Partial<ICharacter>) {
        const res = await CharacterModel.findOneAndUpdate({ id }, data, { session: this.session });
        return this.warpper(res);
    }
}

export { CharacterController };