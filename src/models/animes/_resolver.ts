import * as Updates from '../updates';
import * as Animes from '.';
import { IAnimeGqlRaw2, IAnimeSchema } from '.';
import { MediaLink, MediaTag } from '../../types/utils';
import { ResolverHelper } from '..';


interface GqlAnimeCreateInput {
    reason: string,
    data: IAnimeGqlRaw2
}

interface GqlAnimeUpdateInput {
    reason: string,
    dataID: number,
    changes: any
}


interface GqlAnimeVerifyUpdateInput {
    updateID: string
    action: "ACCEPT" | "DELETE" | "AWAIT_USER_CHANGES"
    withChanges: any,
    reason: string
}

interface GqlAnimeDeleteInput {
    reason: string
    perm: boolean
}

interface Resolves {
    [key: string]: (_: any, input: any, ctx: any) => void
}

class Resolver {
    public static Query: Resolves = {
        animes: (a, b, c) => this.needToBeLogged(a, b, c).then(this.search.bind(this)),
        updates: (a, b, c) => this.needToBeLogged(a, b, c).then(this.searchUpdate.bind(this, b, c)),
    }

    public static Mutation: Resolves = {
        animeCreateRequest: (a, b, c) => this.needToBeLogged(a, b, c).then(this.create.bind(this, b, c)),
        animeUpdateRequest: (a, b, c) => this.needToBeLogged(a, b, c).then(this.update.bind(this, b, c)),
        // animeUpdateVerification: this.verify,
        // animeUpdateRequest: this.update,
        // animeDeleteRequest: this.delete,
    }


    public static async needToBeLogged(_: any, input: any, ctx: any) {
        let user = null;
        return user;
    }

    private static async search() {
        // let test = Updates.Model.find({ ref: undefined }).populate(['references', 'data']);
        // (await test).map(async (res) => {
        //     console.log(res.toJSON())
        // })
        return [{
            _id: 1,
            title: {
                romaji: "Kimetsu no yaiba",
                english: "Demon Slayer"
            }
        },
        {
            _id: 2,
            title: {
                romaji: "Jujutsu kaisen",
                english: "test"
            }
        }]
    }

    private static async searchUpdate(input: any, ctx: any, user: any) {
        console.log(ctx)
        let test = Updates.Model.find({ ref: undefined }).populate(['references', 'data']);
        (await test).map(async (res) => {
            console.log(res.toJSON())
        })
    }

    private static async create(input: GqlAnimeCreateInput, user: any) {

        // let test = { "_id": 1, "action": "new", "status": "AWAIT_VERIFICATION", "dbName": "animes", "user": "", "data": 1, "dataDeleted": false, "verified": false, "createdAt": ISODate("2023-04-20T19:47:40.277Z"), "__v": 0 }
        // let test2 = { "_id": 2, "action": "new", "status": "AWAIT_VERIFICATION", "dbName": "companys", "user": "", "data": 1, "dataDeleted": false, "ref": 1, "verified": false, "createdAt": ISODate("2023-04-20T19:47:40.259Z"), "__v": 0 }

        console.log('INFO - Resolver Animes (create) :', "Requête reçu.");

        const { data, reason } = input;

        const modelResolve = new Animes.AnimeModelResolve(data, user);

        // Chargement des données + vérification.

        let { errors } = await modelResolve.loadData();

        if (errors.length) {
            return {
                message: "Vous avez une ou plusieurs erreurs.",
                errors: errors.map(({ key, err }) => {
                    console.error(err);
                    let message = err.toString().includes('ValidationError:') ?
                        err.toString().split(': ')[2] :
                        err.toString();

                    return {
                        key,
                        message
                    }
                }),
            }
        }

        // Sauvegarde des données.

        let { animeID, updateID, saveErrors } = await modelResolve.saveData(reason);

        if (saveErrors.length) {
            return {
                message: "Vous avez une ou plusieurs erreurs.",
                errors: errors.map(({ key, err }) => {
                    console.error(err);
                    let message = err.toString().includes('ValidationError:') ?
                        err.toString().split(': ')[2] :
                        err.toString();
                    return {
                        key,
                        message
                    }
                }),
            }
        } else {
            console.log("L'anime", animeID, "update=", updateID, "a été ajouté a la base de donnée.");
            return {
                message: "L'anime " + animeID + " a été ajouté a la base de donnée.",
                errors: []
            }
        }
    }

    private static async update(input: GqlAnimeUpdateInput, user: any) {


        console.log('INFO - Resolver Animes (update) :', "Requête reçu.");

        const { dataID, changes, reason } = input;

        let modelResolve = new Animes.AnimeModelResolve(changes, user);

        let { errors, updateFormated, savesMedias, savesUpdates } = await modelResolve.loadData(true);

        if (errors.length) {
            return {
                message: "Vous avez une ou plusieurs erreurs.",
                errors: errors.map(({ key, err }) => {
                    console.error(err);
                    let message = err.toString().includes('ValidationError:') ?
                        err.toString().split(': ')[2] :
                        err.toString();

                    return {
                        key,
                        message
                    }
                }),
            }
        }

        let anime = await Animes.Model.findById(dataID);

        if (!anime) throw "L'anime que vous voulez modifier n'existe pas.";
        console.log(anime.toJSON(), { ...changes, ...updateFormated })

        let getChanges = ResolverHelper.generateChanges(anime.toJSON(), { ...changes, ...updateFormated });

        if (!Object.keys(getChanges).length) return {
            message: "Vous avez une ou plusieurs erreurs.",
            errors: [{ key: 'changes', message: "Aucune modification n'a été détecté." }]
        };

        console.log('modifications', getChanges);

        let update = new Updates.Model({
            action: 'update',
            status: 'AWAIT_VERIFICATION',
            dbName: 'anime',
            user: '',
            data: anime._id,
            changes: getChanges,
            dataDeleted: false,
            reason: reason
        });

        await update.validate();

        if (savesMedias) await Promise.all(savesMedias.map(async (data) => await data.save()))
        if (savesUpdates) await Promise.all(savesUpdates.map(async (data) => {
            data.ref = update._id;
            await data.save();
        }));

        await update.save();

        return {
            message: "Votre demande de modification a été sauvegardé.",
            errors: []
        }
    }

    private static async verify(input: GqlAnimeVerifyUpdateInput) {

        const { action, updateID, reason, withChanges } = input;

        switch (action) {
            /** Le moderateur accepte la modification */
            case 'ACCEPT':
                var updateData = await Updates.Model.findById(updateID);
                if (updateData) {
                    let anime = await Animes.Model.findById(updateData.data);
                    if (anime) {
                        let changes = { ...updateData.changes, ...withChanges };
                        /** Si la modification est une nouvelle donnée */
                        if (updateData.action === 'new') {
                            /** On met la mise a jour en vérifié */
                            await updateData.update({
                                ...withChanges ? {
                                    changes,
                                } : {},
                                verified: true
                            });
                            /** On applique les changements a l'anime et on le met en vérifié */
                            await anime.update({
                                ...changes,
                                verified: true
                            })
                        } else
                            /** Si la modification est une modification de la donnée */
                            if (updateData.action === 'update') {
                                /** On met la mise a jour en vérifié */
                                await updateData.update({
                                    ...withChanges ? {
                                        changes,
                                    } : {},
                                    verified: true
                                });
                                /** On applique les changements a l'anime et on le met en vérifié */
                                await anime.update({
                                    ...changes,
                                    verified: true
                                })
                            } else
                                /** Si la modification est une suppression de la donnée */
                                if (updateData.action === 'delete') {
                                    /** Suppression des anciennes updates */
                                    await Updates.Model.deleteMany({ data: anime._id });
                                    /** Création d'une update qui contient les donnée de l'anime supprimé */
                                    await Updates.Model.create({
                                        action: 'delete',
                                        status: 'VERIFIED',
                                        dbName: updateData.dbName,
                                        user: '',
                                        data: undefined,
                                        changes: anime.toJSON(),
                                        dataDeleted: true,
                                        reason: updateData.reason,
                                        verified: true
                                    })
                                    /** Suppression de l'anime */
                                    await anime.delete();
                                }

                    }
                }
                break;
            /** Le modérateur demande a l'utilisateur de faire des modifications */
            case "AWAIT_USER_CHANGES":
                var updateData = await Updates.Model.findById(updateID);
                if (updateData) {
                    let anime = await Animes.Model.findById(updateData.data);
                    if (anime) {
                        let changes = { ...updateData.changes, ...withChanges };
                        /** Mise a jour de l'update */
                        await updateData.update({
                            status: 'AWAIT_USER_CHANGES',
                            reason: reason,
                            ...withChanges ? {
                                changes,
                            } : {},
                            verified: false
                        });
                    }
                }
                break;
            /** Le modérateur supprime la demande de modification */
            case "DELETE":
                var updateData = await Updates.Model.findById(updateID);
                if (updateData) {
                    let anime = await Animes.Model.findById(updateData.data);
                    if (anime) {
                        /** Si la demande concerne une nouvelle donnée */
                        if (updateData.action === 'new') {
                            /** On supprime l'anime qui n'est pas vérifié */
                            await anime.delete();
                            await updateData.delete();
                        } else
                            /** Si la demande concerne une mise a jour */
                            if (updateData.action === 'update') {
                                /** On supprime la demande */
                                await updateData.delete();
                            } else
                                /** Si la demande concerne une suppression */
                                if (updateData.action === 'delete') {
                                    /** On supprime la demande */
                                    await updateData.delete();
                                }
                    }
                }
                break;
        }
    }

    private static delete(input: GqlAnimeDeleteInput) {

    }


    private static populateResolver(anime: IAnimeSchema) {
        return {
            ...anime.toJSON(),
            title: {
                ...anime.title,
                ...anime.title?.alias ? {
                    alias: () => {
                        return anime.title?.alias as string[]
                    }
                } : {},
            },
            ...anime.tags ? {
                tags: () => {
                    return anime.tags as MediaTag[]
                }
            } : {},
            ...anime.links ? {
                links: () => {
                    return anime.links as MediaLink[]
                }
            } : {},
            ...anime.studios ? {
                studios: async () => {
                    await anime.populate('studios');
                    return anime.studios
                }
            } : {},
            ...anime.producers ? {
                producers: async () => {
                    await anime.populate('producers');
                    return anime.producers
                }
            } : {},
            ...anime.relationsAnime ? {
                relationsAnime: async () => {
                    await anime.populate('relationsAnime.data')
                    return anime.relationsAnime
                }
            } : {},
            ...anime.relationsManga ? {
                relationsManga: async () => {
                    await anime.populate('relationsManga.data')
                    return anime.relationsManga
                }
            } : {},
            ...anime.staffs ? {
                staffs: async () => {
                    await anime.populate('staffs.data')
                    return anime.staffs
                }
            } : {},
            ...anime.characters ? {
                characters: async () => {
                    await anime.populate('characters.data');
                    return anime.characters
                }
            } : {},
            ...anime.tracks ? {
                tracks: async () => {
                    await anime.populate('tracks.data');
                    return anime.tracks
                }
            } : {},
            ...anime.updates ? {
                updates: async () => {
                    await anime.populate('updates');
                    return anime.updates
                }
            } : {}
        }
    }

    static async exist(_id: number) {
        let dbExist = await Animes.Model.exists({ _id });
        if (dbExist?._id) return true
        else return false
    }
}

export { Resolver };