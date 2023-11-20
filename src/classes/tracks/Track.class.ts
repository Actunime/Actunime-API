import { Document } from 'mongoose';
import { TrackRequestModel } from './Track.db';

type TrackType =
    "OST" |
    "OP" |
    "ED" |
    "INSERT"

type ILink = { name: string, value: string }[]

export interface TrackClassProps {
    _id?: number
    type?: TrackType
    name?: string
    artists?: number[]
    episodes?: number[]
    links?: ILink
    createdDate?: Date,
    verified?: boolean
    createdAt?: Date
    editedAt?: Date

}

export class TrackClass {

    public data?: TrackClassProps;

    public document: Document<unknown, any, TrackClassProps> & Omit<TrackClassProps & Required<{ _id: number; }>, never>;

    constructor(props?: TrackClassProps) {
        this.data = props;

        this.document = new TrackRequestModel(this.data);
    }

    public async init() {
        this.setDocument();
        await this.document.validate();
    }

    public setDocument() {
        this.document = new TrackRequestModel(this.data);
    }

}