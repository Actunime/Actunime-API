
import {
    Animes,
    Characters,
    Companys,
    Persons,
    ResolverHelper,
    Tracks,
    Updates
} from "..";
import AutoIncrement from "../../lib/_autoIncrementPlugin";


export class AnimeModelResolve {

    private savesMedias: (
        Companys.ICompanySchema |
        Animes.IAnimeSchema |
        Persons.IPersonSchema |
        Characters.ICharacterSchema |
        Tracks.ITrackSchema
    )[] = [];

    private savesUpdates: Updates.IUpdateSchema[] = [];

    private anime: Animes.IAnimeOnSaving = {}

    private user: any;

    private data: Animes.IAnimeGqlRaw2;

    private errors: { key: string, err: any }[] = [];

    constructor(data: Animes.IAnimeGqlRaw2, user: any) {
        this.user = user;
        this.data = data;
    }

    public async loadData(isAnUpdate?: boolean) {

        const resolverHelper = new ResolverHelper(this.user);
        const data = this.data;

        /** Ajout des studios */

        try {

            if (data.studios?.length) {
                console.log('INFO - Resolver Animes (create) :', `${data.studios.length} studios détectée.`);
                const { mediaNeedSave, updateNeedSave, ids } = await resolverHelper.hasOrCreateCompany(data.studios, 'studio');
                if (mediaNeedSave) this.savesMedias = this.savesMedias.concat(mediaNeedSave);
                if (updateNeedSave) this.savesUpdates = this.savesUpdates.concat(updateNeedSave);
                this.anime.studios = ids;
            }

        } catch (err) {
            this.errors.push({ key: 'studios', err });
        }

        /** Ajout des producteurs */

        try {

            if (data.producers?.length) {
                console.log('INFO - Resolver Animes (create) :', `${data.producers.length} producteurs détectée.`);
                const { mediaNeedSave, updateNeedSave, ids } = await resolverHelper.hasOrCreateCompany(data.producers, 'producteur');
                if (mediaNeedSave) this.savesMedias = this.savesMedias.concat(mediaNeedSave);
                if (updateNeedSave) this.savesUpdates = this.savesUpdates.concat(updateNeedSave);
                this.anime.producers = ids;
            }

        } catch (err) {
            this.errors.push({ key: 'producers', err });
        }

        /** Ajout des personnages */

        try {

            if (data.characters?.length) {
                console.log('INFO - Resolver Animes (create) :', `${data.characters.length} personnages détectée.`);
                const { mediaNeedSave, updateNeedSave, ids } = await resolverHelper.hasOrCreateData(data.characters, 'character', 'personnage');
                if (mediaNeedSave) this.savesMedias = this.savesMedias.concat(mediaNeedSave);
                if (updateNeedSave) this.savesUpdates = this.savesUpdates.concat(updateNeedSave);
                this.anime.characters = ids;
            }

        } catch (err) {
            this.errors.push({ key: 'characters', err });
        }

        /** Ajout des staffs */

        try {

            if (data.staffs?.length) {
                console.log('INFO - Resolver Animes (create) :', `${data.staffs.length} staffs détectée.`);
                const { mediaNeedSave, updateNeedSave, ids } = await resolverHelper.hasOrCreateData(data.staffs, 'person', 'staff');
                if (mediaNeedSave) this.savesMedias = this.savesMedias.concat(mediaNeedSave);
                if (updateNeedSave) this.savesUpdates = this.savesUpdates.concat(updateNeedSave);
                this.anime.staffs = ids;
            }

        } catch (err) {
            this.errors.push({ key: 'staffs', err });
        }

        /** Ajout des musiques */

        try {

            if (data.tracks?.length) {
                console.log('INFO - Resolver Animes (create) :', `${data.tracks.length} musiques détectée.`);
                const { mediaNeedSave, updateNeedSave, ids } = await resolverHelper.hasOrCreateData(data.tracks, 'track', 'musique');
                if (mediaNeedSave) this.savesMedias = this.savesMedias.concat(mediaNeedSave);
                if (updateNeedSave) this.savesUpdates = this.savesUpdates.concat(updateNeedSave);
                this.anime.tracks = ids;
            }

        } catch (err) {
            this.errors.push({ key: 'tracks', err });
        }

        /** Relations verification */

        try {

            if (data.relations?.length) {
                console.log('INFO - Resolver Animes (create) :', `${data.relations.length} relations détectée.`);
                const { animes, mangas } = await resolverHelper.hasRelationsOrError(data.relations);
                if (animes.length) this.anime.relationsAnime = animes;
                if (mangas.length) this.anime.relationsManga = mangas;
            }

        } catch (err) {
            this.errors.push({ key: 'relations', err });
        }

        if (isAnUpdate) return { errors: this.errors, updateFormated: this.anime, savesMedias: this.savesMedias, savesUpdates: this.savesUpdates };

        try {

            const formatedData = { ...this.data, ...this.anime };

            console.log(formatedData)

            let newData = new Animes.Model(formatedData);

            await newData.validate();

            this.anime._id = newData._id;

            if (this.errors.length) {
                if (newData._id) AutoIncrement.reservedIds.delete('animes' + '-pre-' + newData._id);
                if (formatedData.studios)
                    for (let i = 0; i < formatedData.studios.length; i++) AutoIncrement.reservedIds.delete('companys' + '-pre-' + formatedData.studios[i]);
                if (formatedData.producers)
                    for (let i = 0; i < formatedData.producers.length; i++) AutoIncrement.reservedIds.delete('companys' + '-pre-' + formatedData.producers[i]);
                if (formatedData.characters)
                    for (let i = 0; i < formatedData.characters.length; i++) AutoIncrement.reservedIds.delete('characters' + '-pre-' + formatedData.characters[i]);
                if (formatedData.tracks)
                    for (let i = 0; i < formatedData.tracks.length; i++) AutoIncrement.reservedIds.delete('tracks' + '-pre-' + formatedData.tracks[i]);
                if (formatedData.staffs)
                    for (let i = 0; i < formatedData.staffs.length; i++) AutoIncrement.reservedIds.delete('staffs' + '-pre-' + formatedData.staffs[i]);
            }

        } catch (err) {
            this.errors.push({ key: 'validation', err });
        }

        return { errors: this.errors }
    }

    public getData() {
        const formatedData = { ...this.data, ...this.anime };
        return formatedData;
    }

    public async saveData(reason: string) {

        const formatedData = { ...this.data, ...this.anime };

        let newData = new Animes.Model(formatedData);

        let update = new Updates.Model({
            action: 'new',
            status: 'AWAIT_VERIFICATION',
            dbName: 'anime',
            user: '',
            data: newData._id,
            changes: undefined,
            deleted: false,
            reason: reason,
        });

        try {
            await newData.validate();
            await update.validate();
        } catch (err) {
            this.errors.push({ key: 'validation', err });
        }

        try {
            update.data = newData._id;
            await update.save();
            await newData.save();

            // Sauvegarder les autres élements dans la base de donnée.
            await Promise.all(this.savesMedias.map(async (data) => await data.save()));
            await Promise.all(this.savesUpdates.map(async (data) => {
                data.ref = update._id;
                await data.save();
            }));

        } catch (err) {
            // Suppression des éléments sauvegardé par inadvertance.
            try { await update.delete(); } catch { }
            try { await newData.delete(); } catch { }
            await Promise.all(this.savesMedias.map(async (data) => {
                try { return await data.delete() } catch { }
            }));
            await Promise.all(this.savesUpdates.map(async (data) => {
                try { return await data.delete() } catch { }
            }));

            if (newData._id) AutoIncrement.reservedIds.delete('animes' + '-pre-' + newData._id);
            if (formatedData.studios)
                for (let i = 0; i < formatedData.studios.length; i++) AutoIncrement.reservedIds.delete('companys' + '-pre-' + formatedData.studios[i]);
            if (formatedData.producers)
                for (let i = 0; i < formatedData.producers.length; i++) AutoIncrement.reservedIds.delete('companys' + '-pre-' + formatedData.producers[i]);
            if (formatedData.characters)
                for (let i = 0; i < formatedData.characters.length; i++) AutoIncrement.reservedIds.delete('characters' + '-pre-' + formatedData.characters[i]);
            if (formatedData.tracks)
                for (let i = 0; i < formatedData.tracks.length; i++) AutoIncrement.reservedIds.delete('tracks' + '-pre-' + formatedData.tracks[i]);
            if (formatedData.staffs)
                for (let i = 0; i < formatedData.staffs.length; i++) AutoIncrement.reservedIds.delete('staffs' + '-pre-' + formatedData.staffs[i]);

            this.errors.push({ key: 'save', err });
        }

        return { animeID: newData._id, updateID: update._id, saveErrors: this.errors }
    }
}