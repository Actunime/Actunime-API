import { Anime, AnimeGraphql } from "./_Anime.classes";
import { AnimeGraphqlProps, AnimeProps } from "./_Anime.types";




class AnimeManager<T extends Anime | AnimeGraphql> {
    private data: T;

    constructor(data: T) {
        this.data = data;
    }

}



class AnimeGraphqlManager {
    private data: AnimeGraphqlProps;

    constructor(data: AnimeGraphqlProps) {
        this.data = data;
    }

    
}