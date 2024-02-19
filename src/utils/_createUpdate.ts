import { BeAnObject, IObjectWithTypegooseFunction, ReturnModelType } from "@typegoose/typegoose/lib/types";
import { Document, Types } from 'mongoose';
import { ClassType } from "type-graphql";
import { createDataFromUpdate } from "./_genMediaFromUpdate";
import { IMedia } from "./_media.base";

export type MediaDoc<TMedia extends object, T = IMedia<TMedia>> = Document<T, BeAnObject, T> & Omit<T & { _id: Types.ObjectId; }, "typegooseName"> & IObjectWithTypegooseFunction

export interface UpdateParams<TMedia extends object, TDB = ReturnModelType<any, any>> {
    changes: TMedia,
    db: TDB,
    author: string,
    verifiedBy?: string,
    docToSaveWith?: MediaDoc<any>[]
}

export function createUpdate<
    TMedia extends object, TDB extends ReturnModelType<ClassType<IMedia<TMedia>>, TMedia> = ReturnModelType<any, any>>(
        options: UpdateParams<TMedia, TDB>
    ) {

    const { changes, author, verifiedBy, db, docToSaveWith } = options;

    const update = {
        changes,
        author,
        verifiedBy,
    }

    return {
        returnModels: (): MediaDoc<any>[] => {
            const model = new db() as MediaDoc<any>;

            model.updates.push(update);
            return docToSaveWith ? [model, ...docToSaveWith] : [model];
        },
        save: async () => {
            try {
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
            } catch (err) {
                console.error('ON SAVE', err)
                throw "Une erreur s'est produire lors de la sauvegarde"
            }
        },
        addTo: async (id: string) => {

            const query = await db.findOne({ id });

            if (!query) return null;

            const modified = await query.updateOne({
                $set: { 'data': createDataFromUpdate([...query.updates, update]) },
                $push: { 'updates': update }
            }, { runValidators: true, new: true }).lean();

            if (!modified)
                return null

            return modified as IMedia<TMedia>;
        },
        edit: async (id: string, updateId: string) => {

            let keys = Object.keys(update.changes);
            let setData: any = {};
            for (let i = 0; i < keys.length; i++)
                setData[`updates.$.changes.${keys[i]}`] = update.changes[keys[i] as keyof typeof update.changes]

            const query = await db.findOne({
                id,
                $and: [
                    { updates: { $elemMatch: { id: updateId } } },
                    { 'updates.verifiedBy': update.verifiedBy }
                ]
            })

            if (!query) return null;

            let oldVersion = query.updates.find((u) => u.id === updateId);

            let modified = await db.updateOne(
                {
                    id,
                    $and: [
                        { updates: { $elemMatch: { id: updateId } } },
                        { 'updates.verifiedBy': update.verifiedBy }
                    ]
                },
                {
                    $set: {
                        'data': createDataFromUpdate([...query.updates, { ...oldVersion, ...update }]),
                        ...setData
                    }
                },
                { runValidators: true }
            )

            return modified;
        }
    }
}