import { Document, Error } from 'mongoose';
import { CompanyClass, CompanyClassProps } from '../companys/Company.class';
import { CompanyRequestModel } from '../companys/Company.db';
import { AnimeClass } from './_Anime.helper';
import { CharacterRequestModel } from '../characters/Character.db';
import { CharacterRequestClass, CharacterRequestClassProps } from '../characters/CharacterRequest.class';
import { PersonRequestClass } from '../persons/PersonRequest.class';
import { PersonRequestModel } from '../persons/Person.db';
import { TrackRequestModel } from '../tracks/Track.db';
import { CompanyRequestClass } from '../companys/CompanyRequest.class';
import { AnimeClassProps, AnimeRequestProps } from './_Anime.types';

export class AnimeRequestClass {

    public data?: AnimeRequestProps;

    public formated: AnimeClass = new AnimeClass();

    public unsavedDocument: (Document<unknown, any, any> & Omit<any & Required<{ _id: number; id: number }>, never>)[] = [];

    constructor(props: AnimeRequestProps) {
        this.data = props;
    }

    public async init() {

        this.formated.data = {
            ...this.data,
            companys: await this.getCompanys(),
            staffs: await this.getStaffs(),
            characters: await this.getCharacters(),
            tracks: await this.getTracks()
        }

        let test = await this.formated.init();

        this.unsavedDocument.push(this.formated.document);
    }

    private async getCompanys() {
        let formatedCompanys: AnimeClassProps['companys'] = [];
        const newCompanys = this.data?.companys?.new;

        if (newCompanys) {
            let checkNewCompanys = newCompanys.map(async (newCompany) => {
                const company = new CompanyRequestClass(newCompany);
                await company.init();
                // console.log('getCompanys', company.formated.document)
                this.unsavedDocument = this.unsavedDocument.concat([...company.unsavedDocument])
                if (!company.formated.document.id) throw "companys ?";
                return company.formated.document.id
            })

            let ids = await Promise.all(checkNewCompanys);
            formatedCompanys = formatedCompanys.concat(ids);
        }

        const oldCompanys = this.data?.companys?.old;

        if (oldCompanys) {
            let checkExistCompanys = oldCompanys.map(async (id) => {
                let exist = await CompanyRequestModel.exists({ id: id });
                if (!exist) throw new Error(`Unknown company id - ${id}`);
                return id;
            })

            let ids = await Promise.all(checkExistCompanys);
            formatedCompanys = formatedCompanys.concat(ids);
        }

        return formatedCompanys;
    }


    private async getCharacters() {
        let formatedCharacters: AnimeClassProps['characters'] = [];
        const newCharacters = this.data?.characters?.new;

        if (newCharacters) {
            let checkNewCharacters = newCharacters.map(async ({ relationDesc, data }) => {
                const characterRequest = new CharacterRequestClass(data);
                await characterRequest.init();
                this.unsavedDocument = this.unsavedDocument.concat([...characterRequest.unsavedDocument])
                if (!characterRequest.formated.document.id) throw "characters ?";
                return { relationDesc, id: characterRequest.formated.document.id };
            })

            let idsRel = await Promise.all(checkNewCharacters);
            formatedCharacters = formatedCharacters.concat(idsRel);
        }

        const oldCharacters = this.data?.characters?.old;

        if (oldCharacters) {
            let checkExistCharacters = oldCharacters.map(async ({ relationDesc, id }) => {
                let exist = await CharacterRequestModel.exists({ id: id });
                if (!exist) throw new Error(`Unknown character id - ${id}`);
                return { relationDesc, id };
            })

            let idsRel = await Promise.all(checkExistCharacters);
            formatedCharacters = formatedCharacters.concat(idsRel);
        }

        return formatedCharacters;
    }

    private async getStaffs() {
        let formatedStaffs: AnimeClassProps['staffs'] = [];
        const newStaffs = this.data?.staffs?.new;

        if (newStaffs) {
            let checkNewStaffs = newStaffs.map(async ({ relationDesc, data }) => {
                const staffRequest = new PersonRequestClass(data);
                await staffRequest.init();
                this.unsavedDocument = this.unsavedDocument.concat([...staffRequest.unsavedDocument])
                if (!staffRequest.formated.document.id) throw "staffs ?";
                return { relationDesc, id: staffRequest.formated.document.id };
            })

            let idsRel = await Promise.all(checkNewStaffs);
            formatedStaffs = formatedStaffs.concat(idsRel);
        }

        const oldStaffs = this.data?.staffs?.old;

        if (oldStaffs) {
            let checkExistStaffs = oldStaffs.map(async ({ relationDesc, id }) => {
                let exist = await PersonRequestModel.exists({ id: id });
                if (!exist) throw new Error(`Unknown staff id - ${id}`);
                return { relationDesc, id };
            })

            let idsRel = await Promise.all(checkExistStaffs);
            formatedStaffs = formatedStaffs.concat(idsRel);
        }

        return formatedStaffs;
    }

    private async getTracks() {
        let formatedTracks: AnimeClassProps['tracks'] = [];
        const newTracks = this.data?.tracks?.new;

        if (newTracks) {
            let checkNewTracks = newTracks.map(async ({ relationDesc, data }) => {
                const trackRequest = new PersonRequestClass(data);
                await trackRequest.init();
                this.unsavedDocument = this.unsavedDocument.concat([...trackRequest.unsavedDocument])
                if (!trackRequest.formated.document.id) throw "tracks ?";
                return { relationDesc, id: trackRequest.formated.document.id };
            })

            let idsRel = await Promise.all(checkNewTracks);
            formatedTracks = formatedTracks.concat(idsRel);
        }

        const oldTracks = this.data?.tracks?.old;

        if (oldTracks) {
            let checkExistTracks = oldTracks.map(async ({ relationDesc, id }) => {
                let exist = await TrackRequestModel.exists({ id: id });
                if (!exist) throw new Error(`Unknown track id - ${id}`);
                return { relationDesc, id };
            })

            let idsRel = await Promise.all(checkExistTracks);
            formatedTracks = formatedTracks.concat(idsRel);
        }

        return formatedTracks;
    }

}