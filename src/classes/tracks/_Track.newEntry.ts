import { Document } from "mongoose";
import { ITrackType, ITrackLink, TrackGraphqlProps, ITrackArtistsGraphql } from "./_Track.types"
import { TrackModel } from "./_Track.models";
import { NewPersonEntry } from "../persons/_Person.newEntry";
import { PersonModel } from "../persons/_Person.models";



export class NewTrackEntry {

    public type?: ITrackType;
    public name?: string;
    public artists?: number[];
    public links?: ITrackLink;
    public createdDate?: Date;

    public document?: Document;
    public documentsToSave: (Document | undefined)[] = [];

    public async init(props: TrackGraphqlProps) {
        this.type = props.type;
        this.name = props.name;
        this.artists = await this.handleArtistsGraphql(props.artists);
        this.links = props.links;
        this.createdDate = props.createdDate;

        this.document = new TrackModel({
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

    private async handleArtistsGraphql(props?: ITrackArtistsGraphql): Promise<number[]> {
        if (!props) return [];

        const news = await Promise.all(props.new.map(async (newData) => {

            const newPerson = await new NewPersonEntry().init(newData);

            return newPerson;
        }))

        const olds = await Promise.all(props.old.map(async (oldData) => {
            const person = await PersonModel.findOne({ id: oldData });
            if (!person) throw `La personne avec l'identifiant ${oldData} n'existe pas.`;

            return person._id;
        }))

        this.addDocumentsToSave(news.map((d) => d.document));

        const ArtistsIds: number[] = [
            ...news.map((d) => d.document?._id),
            ...olds
        ]

        return ArtistsIds;
    }

    private addDocumentsToSave(documents: (Document | undefined)[]) {

        this.documentsToSave = this.documentsToSave.concat(documents);
    }


    public toJSON() {
        return {
            type: this.type,
            name: this.name,
            artists: this.artists,
            links: this.links,
            createdDate: this.createdDate
        }
    }
}