import { BeAnObject, IObjectWithTypegooseFunction, ReturnModelType } from "@typegoose/typegoose/lib/types";
import { Document, Types } from 'mongoose';
import { IMediaFormat } from "./_media.format";
import { IMediaUpdates } from "./_media.update";
import { ClassType } from "type-graphql";
import { genMediaFromUpdate } from "./_genMediaFromUpdate";

export type MediaDoc<T = any> = Document<unknown, BeAnObject, T> & Omit<T & { _id: Types.ObjectId; }, "typegooseName"> & IObjectWithTypegooseFunction

export function createUpdate<TMedia extends object, TDB extends ReturnModelType<ClassType<IMediaFormat<TMedia, any, any>>, TMedia> = ReturnModelType<any, any>>(
    options: {
        /** Les données a modifier */
        media: TMedia,
        /** Model base de données */
        db: TDB,
        /** Public */
        visible: boolean;
        /** Document a sauvegarder avec cette mise a jour */
        docToSaveWith?: MediaDoc[]
    }) {

    const { media, visible, db, docToSaveWith } = options;

    const update: IMediaUpdates<TMedia> = {
        // versionId: genPublicID(),
        data: media,
        // createdAt: new Date(),
        updatedAt: new Date(),
        visible
    }

    return {
        returnModels: () => {
            const model: MediaDoc = new db();
            model.updates.push(update);
            return docToSaveWith ? [model, ...docToSaveWith] : [model];
        },
        save: async () => {

            if (docToSaveWith)
                for await (let doc of docToSaveWith) {
                    await doc.validate();
                }


            const model = new db();
            model.updates.push(update);
            await model.validate();

            if (docToSaveWith)
                for await (let doc of docToSaveWith) {
                    await doc.save();
                    console.log('relation doc saved')
                }

            await model.save({ validateBeforeSave: false });
            console.log('main doc saved')
            return model;
        },
        addTo: async (pubId: string) => {
            const query = await db.findOne({
                pubId
            })
            if (!query) return null;

            update.createdAt = new Date();

            let modified = await query.updateOne({
                $set: {
                    'data': genMediaFromUpdate([...query.updates.map(x => x.toJSON()), update])
                },
                $push: { 'updates': update }
            },
                { runValidators: true }
            )

            return modified;
        },
        edit: async (pubId: string, versionId: string, moderator: string) => {

            let keys = Object.keys(update.data);
            let setData: any = {};
            for (let i = 0; i < keys.length; i++)
                setData[`updates.$.data.${keys[i]}`] = update.data[keys[i] as keyof typeof update.data]

            const query = await db.findOne({
                pubId,
                $and: [
                    { updates: { $elemMatch: { versionId } } },
                    { 'updates.moderator': moderator }
                ]
            })

            if (!query) return null;

            let oldVersion = query.updates.find((u) => u.versionId === versionId);
        
            let modified = await db.updateOne(
                {
                    pubId,
                    $and: [
                        { updates: { $elemMatch: { versionId } } },
                        { 'updates.moderator': moderator }
                    ]
                },
                {
                    $set: {
                        'data': genMediaFromUpdate([...query.updates.map(x => x.toJSON()), { ...oldVersion.toJSON(), ...update }]),
                        ...setData,
                        'updates.$.updatedAt': update.updatedAt,
                        'updates.$.visible': update.visible
                    }
                },
                { runValidators: true }
            )

            return modified;
        }
    }
}