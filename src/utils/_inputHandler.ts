// import { BeAnObject, IObjectWithTypegooseFunction, ReturnModelType } from "@typegoose/typegoose/lib/types";
// import { Document, Types } from 'mongoose';
// import { IMediaFormat } from "./_media.format";
// import { IMediaUpdates } from "./_media.update";
// import { IMediaRequests } from "./_media.request";
// import { MediasHandler } from "./_mediasHandlers";


// type MediaDoc<T = any> = Document<unknown, BeAnObject, T> & Omit<T & { _id: Types.ObjectId; }, "typegooseName"> & IObjectWithTypegooseFunction
// // type ToSaveType = { label: string, action: string, id: string, model: MediaDoc<IMediaFormat<any, IMediaUpdates<any>, IMediaRequests<any>>> };
// interface handlerOption<TMedia> {
//     mediaToUpdate?: string,
//     versionToUpdate?: number,
//     public?: boolean,
//     label: string,
//     action: string,
//     field?: Partial<IMediaUpdates<TMedia>>
// }
// export type ObjectId = Types.ObjectId;

// export interface ToSaveType<TMedia> {
//     label: string;
//     action: string;
//     id: string;
//     model: MediaDoc<IMediaFormat<TMedia, IMediaUpdates<TMedia>, IMediaRequests<TMedia>>>;
// }

// export type HandlerInputOnly<T, M extends string = ''> = Omit<T, 'addMultiupleMediasToSave' | 'createRequest' | 'createUpdate' | 'dbMediaAction' | 'media' | 'mediasToSave' | 'db' | 'init' | 'handlePersonsGraphql' | 'handleCharactersGraphql' | 'handleTracksGraphql' | 'handleCompanysGraphql' | M>

// class InputHandler<TMedia> extends MediasHandler {
//     public media!: TMedia;
//     public db!: ReturnModelType<any, any>

//     public mediasToSave: ToSaveType<TMedia>[] = [];

//     public addMultiupleMediasToSave(data: ToSaveType<TMedia>[]) {
//         this.mediasToSave = this.mediasToSave.concat(data);
//     }

//     public async createUpdate(options: handlerOption<TMedia>): Promise<ToSaveType<TMedia>> {
//         if (!this.media || !this.db) throw "besoin de init avant.";

//         let model: MediaDoc<IMediaFormat<TMedia, IMediaUpdates<TMedia>, IMediaRequests<TMedia>>>;

//         if (options.mediaToUpdate) {
//             const findAnime = await this.db.findOne({ id: options.mediaToUpdate });
//             if (!findAnime) throw `L'anime avec l'identifiant ${options.mediaToUpdate} que vous voulez modifié n'existe pas.`;
//             model = findAnime;
//         } else {
//             model = new this.db();
//         }

//         if (!options.field) throw "Vous devez spécifié field";

//         // Modifier une modification;
//         if (options.versionToUpdate) {
//             if (!options.mediaToUpdate) throw "vous voulez modifier une version sans mettre l'id de l'anime a modifier ???";

//             let index = model.updates.findIndex((u) => u);
//             let findVersion = model.updates[index];

//             if (!findVersion) throw `La version n°${options.versionToUpdate} que vous voulez modifié n'existe pas.`;

//             if (findVersion.moderator !== options.field.moderator) throw `Vous n'êtes pas autorisé a modifier cette version`;

//             model.updates[index] = {
//                 ...findVersion,
//                 data: {
//                     ...findVersion.data,
//                     ...this.media
//                 },
//                 updatedAt: new Date()
//             }

//         } else {

//             // Ajouter une modification a un media existant ou pas (si il n'existe pas cela est considéré comme un nouveau Media);

//             if (!Array.isArray(model.updates)) model.updates = [];

//             model.updates.push({
//                 versionId: model.updates.length + 1,
//                 data: this.media,
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//                 visible: false,
//                 ...options.field
//             })

//         }

//         try {

//             if (typeof options.public == 'boolean') model.visible = options.public;

//             const validationError = model.validateSync();

//             if (validationError) {
//                 throw validationError.message
//             }

//             this.mediasToSave.push({
//                 label: options.label,
//                 action: options.action,
//                 id: model.id,
//                 model
//             })

//             return {
//                 label: options.label,
//                 action: options.action,
//                 id: model.id,
//                 model
//             };

//         } catch (err) {
//             console.error(err);
//             throw `Erreur lors de la validation ${err?.toString()}`
//         }
//     }

//     async createRequest(options: handlerOption<TMedia>): Promise<ToSaveType<TMedia>> {
//         if (!this.media || !this.db) throw "besoin de init avant.";

//         let model: MediaDoc<IMediaFormat<TMedia, IMediaUpdates<TMedia>, IMediaRequests<TMedia>>>;

//         if (options.mediaToUpdate) {
//             const findAnime = await this.db.findOne({ id: options.mediaToUpdate });
//             if (!findAnime) throw `L'anime avec l'identifiant ${options.mediaToUpdate} que vous voulez modifié n'existe pas.`;
//             model = findAnime;
//         } else {
//             model = new this.db();
//         }

//         if (!options.field) throw "Vous devez spécifié field";

//         // Modifier une modification;
//         if (options.versionToUpdate) {
//             if (!options.mediaToUpdate) throw "vous voulez modifier une version sans mettre l'id de l'anime a modifier ???";

//             let resolver = (r: { versionId: number; }) => r.versionId === options.versionToUpdate;
//             let index = model.requests.findIndex((u) => u);
//             let findVersion = model.requests[index];

//             if (!findVersion) throw `La version n°${options.versionToUpdate} que vous voulez modifié n'existe pas.`;

//             if (!findVersion.acceptNewUpdateFromAuthor) throw `Vous n'êtes pas autorisé a modifier.`

//             if (findVersion.author !== options.field.author) throw `Vous n'êtes pas autorisé a modifier cette version.`;

//             model.requests[index] = {
//                 ...findVersion,
//                 data: {
//                     ...findVersion.data,
//                     ...this.media
//                 },
//                 updatedAt: new Date()
//             }

//         } else {

//             // Ajouter une modification a un media existant ou pas (si il n'existe pas cela est considéré comme un nouveau Media);

//             if (!Array.isArray(model.requests)) model.requests = [];

//             model.requests.push({
//                 versionId: model.requests.length + 1,
//                 data: this.media,
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//                 status: 'UNVERIFIED',
//                 visible: false,
//                 ...options.field
//             })

//         }

//         try {

//             // if (typeof options.public == 'boolean') model.visible = options.public;

//             const validationError = model.validateSync();

//             if (validationError) {
//                 throw validationError.message
//             }

//             this.mediasToSave.push({
//                 label: options.label,
//                 action: options.action,
//                 id: model.id,
//                 model
//             })

//             return {
//                 label: options.label,
//                 action: options.action,
//                 id: model.id,
//                 model
//             };

//         } catch (err) {
//             console.error(err);
//             throw `Erreur lors de la validation ${err?.toString()}`
//         }
//     }

// }

// export { InputHandler }