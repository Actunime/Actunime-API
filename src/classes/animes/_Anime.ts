import { Query } from "mongoose";
import { AnimeModel } from "./_Anime.models";
import {
    IAnimeTitle,
    IAnimeDate,
    IAnimeImage,
    IAnimeEpisodes,
    IAnimeLink,
    IAnimeRelation,
    IAnimeTrackRelation,
    AnimeProps,
    IAnimeDocument
} from "./_Anime.types";
import { Document } from "mongoose";

export class Anime implements AnimeProps {
    public _id?: number;
    public id?: number;

    public title?: IAnimeTitle;
    public date?: IAnimeDate;
    public image?: IAnimeImage;
    public synopsis?: string;
    public source?: string;
    public format?: string;
    public genres?: string[];
    public themes?: string[];
    public status?: string;
    public episodes?: IAnimeEpisodes;
    public adult?: boolean;
    public explicit?: boolean;
    public links?: IAnimeLink;
    public companys?: number[];
    public staffs?: IAnimeRelation[];
    public characters?: IAnimeRelation[];
    public tracks?: IAnimeTrackRelation[];
    
    public document?: IAnimeDocument;
    public documentsToSave: (Document | undefined)[] = [];

    public async saveAll() {
        await Promise.all(this.documentsToSave.map(async (doc) => {
            await doc?.save();
        }))
        await this.document?.save();
    }

    constructor(props: AnimeProps | IAnimeDocument) {
        this._id = props._id;
        this.id = props.id;
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
        this.companys = props.companys;
        this.staffs = props.staffs;
        this.characters = props.characters;
        this.tracks = props.tracks;
    }

    public async get() {
        if (this._id) {
            return await AnimeModel.findById({ _id: this._id })
        }
        return null;
    }

    public toJSON() {
        return {
            title: this.title,
            date: this.date,
            image: this.image,
            synopsis: this.synopsis,
            source: this.source,
            format: this.format,
            genres: this.genres,
            themes: this.themes,
            status: this.status,
            episodes: this.episodes,
            adult: this.adult,
            explicit: this.explicit,
            links: this.links,
            companys: this.companys,
            staffs: this.staffs,
            characters: this.characters,
            tracks: this.tracks,
        }
    }
}
