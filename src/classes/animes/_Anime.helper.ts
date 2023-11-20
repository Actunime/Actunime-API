import { Document, Model, Schema, model } from 'mongoose';
import { AnimeRequestModel } from './_Anime.schemas';
import { AnimeClassProps } from './_Anime.types';
// import { AnimeModel, AnimeSchema } from './Anime.db';

export class AnimeClass {
    public data?: AnimeClassProps;

    public document: Document<unknown, any, AnimeClassProps> & Omit<AnimeClassProps & Required<{ _id: number; }>, never>;

    constructor(props?: AnimeClassProps) {
        this.data = props;
        // LoadModel
        this.document = new AnimeRequestModel(this.data);
    }

    public async init() {
        this.setDocument();
        await this.document.validate();
        return new AnimeRequestModel(this.data);
    }

    private setDocument() {
        this.document = new AnimeRequestModel(this.data);
    }

    public save() {
        this.setDocument();
        this.document.save();
    }

    public toJSON() {
        return this.data
    }
}


new AnimeClass()


class Anime {
    
}

class AnimeRequest {

}