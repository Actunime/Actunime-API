import { Document, Query } from 'mongoose';
import { TrackRequestModel } from './Track.db';
import { PersonRequestClassProps } from '../persons/PersonRequest.class';
import { TrackClass, TrackClassProps } from './Track.class';
import { PersonClass } from '../persons/Person.class';
import { PersonRequestModel } from '../persons/Person.db';

type TrackType =
    "OST" |
    "OP" |
    "ED" |
    "INSERT"

type ILink = { name: string, value: string }[]

export interface TrackRequestClassProps {
    _id?: number
    id?: number,
    type?: TrackType
    name?: string
    artists?: ActorsForTrackRequest
    episodes?: number[]
    links?: ILink
    createdDate?: Date,
    verified?: boolean
    createdAt?: Date
    editedAt?: Date

}

interface ActorsForTrackRequest {
    old: number[],
    new: PersonRequestClassProps[]
}

export class TrackRequestClass {

    public data?: TrackRequestClassProps

    public formated: TrackClass = new TrackClass();

    public unsavedDocument: Document<any>[] = [];

    constructor(props?: TrackRequestClassProps) {
        this.data = props;
    }

    public async init() {

        this.formated.data = {
            ...this.data,
            artists: await this.getArtists()
        }

        await this.formated.init();

        this.unsavedDocument.push(this.formated.document);
    }

    private async getArtists() {
        let formatedActors: TrackClassProps['artists'] = [];
        const newArtists = this.data?.artists?.new;

        if (newArtists)
            for (let i = 0; i < newArtists.length; i++) {
                const artist = new PersonClass(newArtists[i]);
                await artist.init();
                this.unsavedDocument.push(artist.document);
                if (!artist.document._id) throw "?";
                formatedActors.push(artist.document._id);
            }

        const oldArtists = this.data?.artists?.old;

        if (oldArtists) {
            let checkExistActors = oldArtists.map(async (id) => {
                let exist = await PersonRequestModel.exists({ _id: id });
                if (!exist) throw new Error(`Unknown artist id - ${id}`);
                return id;
            })

            let ids = await Promise.all(checkExistActors);
            formatedActors = formatedActors.concat(ids);
        }


        return formatedActors;
    }

}