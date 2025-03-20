import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IPatch, IPatchStatus, ITargetPath, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { IMediaDeleteBody, IPatchPaginationBody } from "@actunime/validations";
import LogSession from "../_utils/_logSession";
import { CharacterController } from "./character.controller";
import { CompanyController } from "./company.controller";
import { GroupeController } from "./groupe.controller";
import { ImageController } from "./image.controller";
import { MangaController } from "./manga.controller";
import { PersonController } from "./person.controler";
import { TrackController } from "./track.controller";
import { applyChange, Diff } from "deep-diff";
import { CheckRealmRoles } from "../_utils/_realmRoles";
import { UtilControllers } from "../_utils/_controllers";
import { DevLog } from "../_lib/logger";
import { PatchModel } from "../_lib/models";

type IPatchDoc = (Document<unknown, unknown, IPatch> & IPatch & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface IPatchResponse extends IPatch {
    parsedPatch: () => Partial<IPatch> | null
    setOriginal: () => void;
    setChanges: () => void;
    delete: (params: IMediaDeleteBody) => Promise<boolean>;
}

type IPatchControlled = IPatchDoc & IPatchResponse

class PatchController extends UtilControllers.withUser {

    constructor(session: ClientSession | null = null, options?: { log?: LogSession, user?: IUser }) {
        super({ session, ...options });
    }

    private parse(patch: Partial<IPatchDoc>) {
        delete patch?._id;

        return patch;
    }

    private warpper(data: IPatchDoc | null): IPatchControlled {
        if (!data)
            throw new APIError("Aucune mise a jour n'a été trouvé", "NOT_FOUND");

        const res = data as IPatchControlled;
        res.parsedPatch = this.parse.bind(this, data)
        res.delete = this.delete.bind(this, data);

        return res;
    }

    async getById(id: string) {
        DevLog(`Récupération de la mise a jour ID: ${id}`, "debug");
        const promise = PatchModel.findOne({ id });
        if (this.session) promise.session(this.session); else promise.cache("60m");
        const res = await promise;
        DevLog(`Mise a jour ${res ? "trouvée" : "non trouvée"}, ID Mise a jour: ${id}`, "debug");
        return this.warpper(res);
    }

    async filter(pageFilter: IPatchPaginationBody, addQuery?: IPatchPaginationBody["query"]) {
        DevLog("Filtrage des mise a jour...", "debug");
        const pagination = new PaginationControllers(PatchModel);

        pagination.useFilter(pageFilter);
        if (addQuery)
            pagination.addQuery(addQuery);
        pagination.setVerifiedOnly(false);

        const res = await pagination.getResults();

        DevLog(`Mise a jour trouvées: ${res.resultsCount}`, "debug");
        return res;
    }

    async getPatchFrom(targetPath: ITargetPath, targetID: string, status?: IPatchStatus) {
        DevLog(`Récupération de la mise a jour de ${targetPath} ID: ${targetID}`, "debug");
        let promise = PatchModel.findOne({ targetPath, "target.id": targetID, ...status ? { status } : {} });
        if (this.session)
            promise = promise.session(this.session);
        else promise.cache("60m");
        const res = await promise;
        DevLog(`Mise a jour ${res ? `trouvée, ID Mise a jour: ${res.id}` : "non trouvée"}`, "debug");
        return res;
    }

    async fitlerPatchFrom(targetPath: ITargetPath, targetID: string, status?: IPatchStatus) {
        DevLog(`Filtrage des mise a jour de ${targetPath} ID: ${targetID}`, "debug");
        let promise = PatchModel.find({ targetPath, "target.id": targetID, ...status ? { status } : {} });
        if (this.session)
            promise = promise.session(this.session);
        else promise.cache("60m");
        const res = await promise;
        DevLog(`Mise a jour trouvées: ${res.length}`, "debug");
        return res;
    }

    async getPatchReferences(id: string) {
        DevLog(`Récupération des references de la mise a jour ID: ${id}`, "debug");
        const res = await PatchModel.find({ ref: { id } }).cache("60m");
        DevLog(`Mise a jour trouvées: ${res.length}`, "debug");
        return res;
    }

    async create(data: Partial<IPatch>) {
        DevLog(`Création d'une mise a jour... | ${data.targetPath} (${data.target?.id})`, "debug");
        const res = new PatchModel(data);
        await res.save({ session: this.session });
        DevLog(`Mise a jour créee, ID Mise a jour: ${res.id} | ${data.targetPath} (${data.target?.id})`, "debug");
        return this.warpper(res);
    }

    async delete(patch: string | IPatchDoc, params: IMediaDeleteBody) {
        DevLog(`Suppression d'une mise a jour...`, "debug");
        this.needUser(this.user);

        const res = typeof patch === "string" ? await this.getById(patch) : patch!;

        if (this.user.roles.find(r => r.startsWith(res.targetPath.toUpperCase()) && r.endsWith("_DELETE"))) {
            throw new APIError("Vous ne pouvez pas supprimer cette mise a jour car vous n'avez pas les permissions", "UNAUTHORIZED");
        }

        const deleted = await res.deleteOne().session(this.session);

        if (deleted.deletedCount > 0) {
            this.log?.add("Suppresion d'une mise a jour", [
                { name: "ID", content: res.id },
                { name: "Raison", content: params.reason },
                { name: "Modérateur", content: `${this.user?.username} (${this.user.id})` }
            ])

            DevLog(`Mise a jour supprimée, ID Mise a jour: ${res.id} | ${res.targetPath} (${res.target?.id})`, "debug");
            return true;
        }

        DevLog(`Mise a jour non supprimée, ID Mise a jour: ${res.id} | ${res.targetPath} (${res.target?.id})`, "debug");
        return false;
    }

    async update(id: string, data: Partial<IPatch>) {
        const res = await PatchModel.findOneAndUpdate({ id }, data, { session: this.session });
        return this.warpper(res);
    }


    async acceptPatchReferences(id: string, params: { reccursive: boolean }) {
        const findPatchReferences = await this.getPatchReferences(id);
        if (findPatchReferences.length > 0) {
            const groupeController = new GroupeController(this.session, { log: this.log, user: this.user });
            const imageController = new ImageController(this.session, { log: this.log, user: this.user });
            const mangaController = new MangaController(this.session, { log: this.log, user: this.user });
            const companyController = new CompanyController(this.session, { log: this.log, user: this.user });
            const personController = new PersonController(this.session, { log: this.log, user: this.user });
            const characterController = new CharacterController(this.session, { log: this.log, user: this.user });
            const trackController = new TrackController(this.session, { log: this.log, user: this.user });
            await Promise.all(
                findPatchReferences.map(async (ref) => {
                    switch (ref.targetPath) {
                        // case "Anime":
                        //     await this.animeController.request_accept(ref.id, params);
                        //     break;
                        // case "Manga":
                        //     await this.mangaController.request_accept(ref.id, params);
                        //     break;
                        // case "Groupe":
                        //     await this.groupeController.request_accept(ref.id, params);
                        //     break;
                        // case "Image":
                        //     await this.imageController.request_accept(ref.id, params);
                        //     break;
                        // case "Character":
                        //     await this.characterController.request_accept(ref.id, params);
                        //     break;
                        // case "Person":
                        //     await this.personController.request_accept(ref.id, params);
                        //     break;
                        // case "Company":
                        //     await this.companyController.request_accept(ref.id, params);
                        //     break;
                        // case "Track":
                        //     await this.trackController.request_accept(ref.id, params);
                        //     break;
                    }
                })
            )
        }
    }

    restoreOriginalFromDifferences(modifiedObject: any, differences: PatchDiff<any>[]) {
        const original = JSON.parse(JSON.stringify(modifiedObject)); // Cloner l'objet modifié

        differences.forEach(change => {
            const { path, kind, rhs, lhs, index, item } = change;

            // Naviguer jusqu'à la bonne clé
            let target = original;
            for (let i = 0; i < path.length - 1; i++) {
                target = target[path[i]];
            }
            const key = path[path.length - 1];

            // Appliquer l'inversion
            switch (kind) {
                case 'N': // New (Ajouté) => Supprimer la propriété
                    delete target[key];
                    break;
                case 'D': // Deleted (Supprimé) => Restaurer l'ancienne valeur
                    target[key] = lhs;
                    break;
                case 'E': // Edited (Modifié) => Restaurer l'ancienne valeur
                    target[key] = lhs;
                    break;
                case 'A': // Array modification
                    if (item.kind === 'N') {
                        target[key].splice(index, 1); // Supprimer l'élément ajouté
                    } else if (item.kind === 'D') {
                        target[key].splice(index, 0, item.lhs); // Restaurer l'élément supprimé
                    } else if (item.kind === 'E') {
                        target[key][index] = item.lhs; // Restaurer l'élément modifié
                    }
                    break;
            }
        });

        return original;
    }

    getModifiedFromDifferences<T>(originalObject: any, differences: PatchDiff<T>[]) {
        const result = JSON.parse(JSON.stringify(originalObject)); // Cloner l'objet original

        differences.forEach((diff) => {
            applyChange(result, undefined, diff); // Appliquer chaque changement
        });

        return result as T; // Retourner l'objet modifié
    }
}

export interface PatchDiff<LHS, RHS = LHS> {
    kind: "N" | "D" | "E" | "A";
    path: any[];
    rhs: RHS;
    lhs: LHS;
    index: number;
    item: Diff<LHS, RHS>;
}
export { PatchController };