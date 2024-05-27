import { IUpdateActionList } from "../_types/updateType";
import { IActivityAction, IActivityType } from "../_utils/activityUtil";
import { ITargetPath } from "../_utils/global";
import { IUpdateStatus } from "../_utils/updateUtil";
import { Document, Model, Schema, models } from "mongoose";
import { CreateActivity } from "./activity";
import { AnimeSaveDB } from "./anime";
import { CharacterSaveDB } from "./character";
import { CompanySaveDB } from "./company";
import { GroupeSaveDB } from "./groupe";
import { MangaSaveDB } from "./manga";
import { PersonSaveDB } from "./person";
import { TrackSaveDB } from "./track";
import { CreateUpdate } from "./update";

type AnyDocType = Document<unknown, {}, any> & Required<{ _id: Schema.Types.ObjectId; }>;
type AnyModelType = Model<any, {}, {}, {}, AnyDocType>
export type IMediaDocTypeToSave = { doc: AnyDocType, path: ITargetPath }

export const getModelByTargetPath = (targetPath: ITargetPath): AnyModelType => {
    return models[targetPath];
}

export const TargetPathSaveDB = {
    Anime: AnimeSaveDB,
    Manga: MangaSaveDB,
    Character: CharacterSaveDB,
    Person: PersonSaveDB,
    Company: CompanySaveDB,
    Groupe: GroupeSaveDB,
    Track: TrackSaveDB
}

export async function BulkCreateMedias(
    options: {
        medias: IMediaDocTypeToSave[],
        authorId: string,
        withUpdate?: boolean,
        withActivity?: boolean,
        updateRef?: string,
        actions: IUpdateActionList[],
        status: IUpdateStatus,
        activityType: IActivityType
    }) {
    const savedMedias: IMediaDocTypeToSave[] = [];

    try {
        for await (const { doc, path } of options?.medias) {
            const model = getModelByTargetPath(path);
            const saved = await model.create(doc);
            savedMedias.push({ doc: saved, path });
        }

        if (options?.withUpdate || options?.withActivity) {
            for await (const { doc, path } of savedMedias) {
                if (path === "Activity") continue;
                if (path === "Update") continue;

                if (options?.withUpdate) {
                    let update = await CreateUpdate({
                        type: "CREATE",
                        author: { id: options?.authorId },
                        actions: options?.actions,
                        changes: doc.toJSON(),
                        target: { id: doc.id },
                        targetPath: path,
                        status: options?.status,
                        ref: options?.updateRef && {
                            id: options?.updateRef,
                        } || undefined,
                    })
                    savedMedias.push({ doc: update, path: "Update" });
                }
                if (options?.withActivity) {
                    let activity = await CreateActivity(options?.activityType, ("CREATE_" + path.toUpperCase()) as IActivityAction, {
                        author: { id: options?.authorId },
                        target: { id: doc.id },
                        targetPath: path,
                    });
                    savedMedias.push({ doc: activity, path: "Activity" });
                }
            }
        }

        return savedMedias;
    } catch (err) {
        console.error(err);
        for await (const { doc, path } of savedMedias) {
            await doc.deleteOne()
                .then(() => console.log("Du a une erreur, la création de", doc.id, path, "a été annulée."))
                .catch(() => { });
        }
        throw err;
    }
}

export async function BulkRequestMedias(
    options: {
        medias: IMediaDocTypeToSave[],
        authorId: string,
        updateRef?: string,
        actions: IUpdateActionList[],
        status: IUpdateStatus,
        activityType: IActivityType
    }) {
    const savedMedias: IMediaDocTypeToSave[] = [];

    try {

        for await (const { doc, path } of savedMedias) {
            if (path === "Activity") continue;
            if (path === "Update") continue;

            let update = await CreateUpdate({
                type: "CREATE",
                author: { id: options?.authorId },
                actions: options?.actions,
                changes: doc.toJSON(),
                target: { id: doc.id },
                targetPath: path,
                status: options?.status,
                ref: options?.updateRef && {
                    id: options?.updateRef,
                } || undefined
            })

            savedMedias.push({ doc: update, path: "Update" });

            let activity = await CreateActivity(options?.activityType, ("CREATE_" + path.toUpperCase()) as IActivityAction, {
                author: { id: options?.authorId },
                target: { id: doc.id },
                targetPath: path,
            });
            savedMedias.push({ doc: activity, path: "Activity" });

        }

        return savedMedias;
    } catch (err) {
        console.error(err);
        for await (const { doc, path } of savedMedias) {
            await doc.deleteOne()
                .then(() => console.log("Du a une erreur, la création de", doc.id, path, "a été annulée."))
                .catch(() => { });
        }
        throw err;
    }
}