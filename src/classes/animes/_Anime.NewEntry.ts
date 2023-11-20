
import { CharacterModel } from "../characters/_Character.models";
import { NewCharacterEntry } from "../characters/_Character.newEntry";
import { CompanyModel } from "../companys/_Company.models";
import { NewCompanyEntry } from "../companys/_Company.newEntry";
import { PersonModel } from "../persons/_Person.models";
import { NewPersonEntry } from "../persons/_Person.newEntry";
import { NewTrackEntry } from "../tracks/_Track.newEntry";
import { Anime } from "./_Anime";
import { AnimeModel } from "./_Anime.models";
import {
    IAnimeRelation,
    AnimeGraphqlProps,
    IAnimeCompanysGraphql,
    IAnimeStaffsGraphql,
    IAnimeCharactersGraphql,
    IAnimeTracksGraphql,
    IAnimeTrackRelation,
    IAnimeDocument
} from "./_Anime.types";
import { Document } from "mongoose";


export class NewAnimeEntry extends Anime {

    public async initNewEntry(props: AnimeGraphqlProps) {
        this.title = props.title;
        this.date = props.date;
        this.image = props.image;
        this.synopsis = props.synopsis;
        this.source = props.source;
        this.format = props.format;
        this.genres = props.genres;
        this.themes = props.themes;
        this.status = props.status;
        this.episodes = props.episodes;
        this.adult = props.adult;
        this.explicit = props.explicit;
        this.links = props.links;
        this.companys = await this.handleCompanysGraphql(props.companys);
        this.staffs = await this.handleStaffsGraphql(props.staffs);
        this.characters = await this.handleCharactersGraphql(props.characters);
        this.tracks = await this.handleTracksGraphql(props.tracks);

        this.document = new AnimeModel({
            updatesRequests: [{
                versionId: 1,
                data: this.toJSON(),
                createdAt: new Date(),
                author: null,
                status: 'UNVERIFIED',
                acceptNewUpdateFromAuthor: false
            }],
            visible: false
        });

        await this.document.validate();

        return this;
    }


    private async handleCompanysGraphql(props?: IAnimeCompanysGraphql): Promise<number[]> {
        if (!props) return [];

        const newCompanys = await Promise.all(props.new.map(async (newCompany) => {
            return await new NewCompanyEntry().init(newCompany);
        }))

        const oldCompanys = await Promise.all(props.old.map(async (oldCompany) => {
            const company = await CompanyModel.findOne({ id: oldCompany });
            if (!company) throw `La société avec l'identifiant ${oldCompany} n'existe pas.`;
            return company._id
        }))

        this.addDocumentsToSave(newCompanys.map((d) => d.document));

        const companysIds: number[] = [...newCompanys.map((doc) => doc.document?._id), ...oldCompanys];

        return companysIds;
    }


    private async handleStaffsGraphql(props?: IAnimeStaffsGraphql): Promise<IAnimeRelation[]> {
        if (!props) return [];

        const news = await Promise.all(props.new.map(async (newData) => {

            const newPerson = await new NewPersonEntry().init(newData.data);

            return {
                relationDesc: newData.relationDesc,
                person: newPerson
            }
        }))

        const olds = await Promise.all(props.old.map(async (oldData) => {
            const person = await PersonModel.findOne({ id: oldData });
            if (!person) throw `La personne avec l'identifiant ${oldData.id} n'existe pas.`;
            return {
                relationDesc: oldData.relationDesc,
                id: person._id
            }
        }))

        this.addDocumentsToSave(news.map((d) => d.person.document));

        const staffsRelations: IAnimeRelation[] = [
            ...news.map((d) => ({ relationDesc: d.relationDesc, id: d.person.document?._id })),
            ...olds
        ]

        return staffsRelations;
    }

    private async handleCharactersGraphql(props?: IAnimeCharactersGraphql): Promise<IAnimeRelation[]> {
        if (!props) return [];

        const news = await Promise.all(props.new.map(async (newData) => {

            const newCharacter = await new NewCharacterEntry().init(newData.data);

            return {
                relationDesc: newData.relationDesc,
                character: newCharacter
            }
        }))

        const olds = await Promise.all(props.old.map(async (oldData) => {
            const person = await CharacterModel.findOne({ id: oldData });
            if (!person) throw `La personne avec l'identifiant ${oldData.id} n'existe pas.`;
            return {
                relationDesc: oldData.relationDesc,
                id: person._id
            }
        }))

        // Character peut contenir des Actors qui sont dans documentsToSave;
        for (let i = 0; i < news.length; i++) {
            const { character: { document, documentsToSave } } = news[i];
            this.addDocumentsToSave([document, ...documentsToSave]);
        }

        const charactersRelations: IAnimeRelation[] = [
            ...news.map((d) => ({ relationDesc: d.relationDesc, id: d.character.document?._id })),
            ...olds
        ]

        return charactersRelations;
    }


    private async handleTracksGraphql(props?: IAnimeTracksGraphql): Promise<IAnimeTrackRelation[]> {
        if (!props) return [];

        const news = await Promise.all(props.new.map(async (newData) => {

            const newTrack = await new NewTrackEntry().init(newData.data);

            return {
                episodes: newData.episodes,
                track: newTrack
            }
        }))

        const olds = await Promise.all(props.old.map(async (oldData) => {
            const track = await CharacterModel.findOne({ id: oldData });
            if (!track) throw `La personne avec l'identifiant ${oldData.id} n'existe pas.`;
            return {
                episodes: oldData.episodes,
                id: track._id
            }
        }))

        // Track peut contenir des Artists qui sont dans documentsToSave;
        for (let i = 0; i < news.length; i++) {
            const { track: { document, documentsToSave } } = news[i];
            this.addDocumentsToSave([document, ...documentsToSave]);
        }

        const tracksRelations: IAnimeTrackRelation[] = [
            ...news.map((d) => ({ episodes: d.episodes, id: d.track.document?._id })),
            ...olds
        ]

        return tracksRelations;
    }


    private addDocumentsToSave(documents: (Document | undefined)[]) {
        this.documentsToSave = this.documentsToSave.concat(documents);
    }

}