import { Animes, Characters, Companys, GlobalInterface, Mangas, Persons, Tracks } from ".";




export class ResolverHelper {

    private user?: any;

    constructor(user: any) {
        this.user = user;
    }

    public async hasOrCreateCompany(dataList: (Companys.ICompanyGql)[], label: string) {

        const mediaNeedSave = [];
        const updateNeedSave = [];
        const ids: number[] = [];

        for (let i = 0; i < dataList.length; i++) {

            const data = dataList[i];

            if (data._id) {
                const exist = await Companys.Resolver.exist(data._id);

                // L'entreprise spécifié en id n'existe pas.
                if (!exist) {
                    console.log('INFO - Resolver Helper :', `Le ${label} spécifié (${data._id}) n'existe pas (retour erreur client).`);
                    throw `Le ${label} spécifié ${data._id} n'existe pas !`;
                }

                console.log('INFO - Resolver Helper :', `Ajout du ${label} existant (${data._id}).`);

                // La data existe donc on ajoute l'id a la liste des id.
                ids.push(data._id);

                continue;
            }

            console.log('INFO - Resolver Helper :', `Création d'un nouveau ${label} (${data.name}).`);
            const { newData, update, saved } = await Companys.Resolver.create(data, this.user);

            if (!saved) {
                mediaNeedSave.push(newData);
                updateNeedSave.push(update);
            }

            ids.push(newData._id);

            continue;

        }

        return {
            mediaNeedSave: mediaNeedSave.length ? mediaNeedSave : undefined,
            updateNeedSave: updateNeedSave.length ? updateNeedSave : undefined,
            ids
        };
    }

    public async hasOrCreateData(dataList: (
        GlobalInterface.SpecialRelInputRaw<Persons.IPersonGql> |
        GlobalInterface.SpecialRelInputRaw<Characters.ICharacterGql> |
        GlobalInterface.SpecialRelInputRaw<Tracks.ITrackGql>
    )[], key: 'character' | 'track' | 'person', keylabel: string) {

        const mediaNeedSave = [];
        const updateNeedSave = [];
        const ids: GlobalInterface.SpecialRelInputRaw<number>[] = [];

        for (let i = 0; i < dataList.length; i++) {

            const { label, data } = dataList[i];
            const DataModel = this.resolveKey(key);

            if (data._id) {
                const exist = await DataModel.Resolver.exist(data._id);

                if (!exist) {
                    console.log('INFO - Resolver Helper :', `Le ${keylabel} spécifié (${data._id}) n'existe pas (retour erreur client).`);
                    throw `Le ${keylabel} spécifié ${data._id} n'existe pas !`;
                }

                console.log('INFO - Resolver Helper :', `Ajout du ${keylabel} existant (${data._id}).`);

                ids.push({ label, data: data._id });

                continue;
            }

            console.log('INFO - Resolver Helper :', `Création d'un nouveau ${keylabel} (${data.name}).`);
            const { newData, update, saved } = await DataModel.Resolver.create(data, this.user);

            if (!saved) {
                mediaNeedSave.push(newData);
                updateNeedSave.push(update);
            }

            ids.push({ label, data: newData._id });

            continue;

        }

        return {
            mediaNeedSave: mediaNeedSave.length ? mediaNeedSave : undefined,
            updateNeedSave: updateNeedSave.length ? updateNeedSave : undefined,
            ids
        };
    }


    public async hasRelationsOrError(relations: GlobalInterface.RelationInput[]) {

        const relationOut: { animes: GlobalInterface.RelationOnSaving[], mangas: GlobalInterface.RelationOnSaving[] } = {
            animes: [],
            mangas: []
        }

        for (let i = 0; i < relations.length; i++) {

            const relation = relations[i];

            switch (relation.type) {

                case 'ANIME':

                    var exist = await Animes.Model.exists({ _id: relation._id });

                    if (!exist) {
                        console.log('INFO - Resolver Helper (create) :', `Relation de type ANIME (${relation._id}) n'existe pas (retour erreur client).`);
                        throw `L'Anime spécifié en "relations" (${relation._id}) n'existe pas.`
                    }

                    console.log('INFO - Resolver Helper (create) :', `Relation de type ANIME (${relation._id}) a été ajouté.`);

                    relationOut.animes.push({ label: relation.label, data: relation._id });

                    break;

                case 'MANGA':

                    var exist = await Mangas.Model.exists({ _id: relation._id });

                    if (!exist) {
                        console.log('INFO - Resolver Helper (create) :', `Relation de type MANGA (${relation._id}) n'existe pas (retour erreur client).`);
                        throw `Le Manga spécifié en "relations" (${relation._id}) n'existe pas.`
                    }

                    console.log('INFO - Resolver Helper (create) :', `Relation de type MANGA (${relation._id}) a été ajouté.`);

                    relationOut.mangas.push({ label: relation.label, data: relation._id });

                    break;

            }

        }

        return relationOut;
    }

    public static generateChanges(object1: any, object2: any) {

        // console.log(object1, object2)

        let changes: { [key: string]: { before?: any, after?: any } | { before?: any, after?: any }[] } = {};
        let bannedKeys = ['votes']

        for (const key in object2) {

            if (bannedKeys.includes(key)) continue;

            if (
                typeof object1?.[key] === 'string' && typeof object2?.[key] === 'string' ||
                typeof object1?.[key] === 'number' && typeof object2?.[key] === 'number'
            ) {
                if (object1[key] !== object2[key]) {
                    if (!changes[key]) changes[key] = {};
                    Object.assign(changes[key], {
                        before: object1[key],
                        after: object2[key]
                    })
                }
            } else if (typeof object1?.[key] === 'boolean' && typeof object2?.[key] === 'boolean') {
                if (object1[key] !== object2[key]) {
                    if (!changes[key]) changes[key] = {};
                    Object.assign(changes[key], {
                        before: object1[key],
                        after: object2[key]
                    })
                }
            } else if (Array.isArray(object1?.[key]) && Array.isArray(object2?.[key])) {
                for (let i = 0; i < (object1?.[key].length > object2?.[key].length ? object1?.[key].length : object2?.[key].length); i++) {
                    const element = object1?.[key][i];
                    const element2 = object2[key][i];
                    if (typeof element2 === 'object') {
                        let compares = this.generateChanges(element, element2);
                        if (!Object.keys(compares).length) continue;
                        if (!changes[key]) changes[key] = {};
                        Object.assign(changes[key], { [i]: compares })
                    } else if (typeof element2 === 'string' || typeof element2 === 'number') {
                        if (element !== element2) {
                            if (!changes[key]) changes[key] = {};
                            Object.assign(changes[key], {
                                [i]: {
                                    before: element,
                                    after: element2
                                }
                            })
                        }
                    }
                }
            } else if (typeof object1?.[key] === 'object' && typeof object2?.[key] === 'object') {
                let compares = this.generateChanges(object1?.[key], object2?.[key]);
                for (const keyx in object2?.[key]) {
                    if (compares[keyx]) {
                        console.log(keyx)
                        if (!changes[key]) changes[key] = {};
                        Object.assign(changes[key], {
                            [keyx]: compares[keyx]
                        })
                    }
                }
            } else if (
                (typeof object1?.[key] === 'undefined' && object2?.[key]) || (typeof object2?.[key] === 'undefined' && object1?.[key])
            ) {
                if (!changes[key]) changes[key] = {};
                Object.assign(changes[key], {
                    before: object1?.[key],
                    after: object2?.[key]
                })
            }
        }

        return changes;
    }

    private resolveKey(key: 'character' | 'track' | 'person') {
        switch (key) {
            case 'character':
                return Characters;
            case 'track':
                return Tracks;
            case 'person':
                return Persons;
        }
    }

}