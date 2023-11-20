import { Document, Query } from 'mongoose';
import { CharacterRequestModel } from './Character.db';
import { PersonRequestClassProps } from '../persons/PersonRequest.class';
import { CharacterClass, CharacterClassProps } from './Character.class';
import { PersonClass } from '../persons/Person.class';
import { PersonRequestModel } from '../persons/Person.db';

export interface CharacterRequestClassProps {
    _id?: number;
    name?: {
        start: string,
        end: string,
        alias: string[]
    }
    age?: number,
    birthDate?: string,
    gender?: string,
    species?: string,
    bio?: string,
    image?: string,
    actors?: ActorsForCharacterRequest
}

interface ActorsForCharacterRequest {
    old: number[],
    new: PersonRequestClassProps[]
}

export class CharacterRequestClass {

    public data?: CharacterRequestClassProps

    public formated: CharacterClass = new CharacterClass();

    public unsavedDocument: Document<any>[] = [];

    constructor(props?: CharacterRequestClassProps) {
        this.data = props;
    }

    public async init() {

        this.formated.data = {
            ...this.data,
            actors: await this.getActors()
        }

        await this.formated.init();

        this.unsavedDocument.push(this.formated.document);
    }

    private async getActors() {
        let formatedActors: CharacterClassProps['actors'] = [];
        const newActors = this.data?.actors?.new;

        if (newActors)
            for (let i = 0; i < newActors.length; i++) {
                const actor = new PersonClass(newActors[i]);
                await actor.init();
                this.unsavedDocument.push(actor.document);
                if (!actor.document._id) throw "?";
                formatedActors.push(actor.document._id);
            }

        const oldActors = this.data?.actors?.old;

        if (oldActors) {
            let checkExistActors = oldActors.map(async (id) => {
                let exist = await PersonRequestModel.exists({ _id: id });
                if (!exist) throw new Error(`Unknown actor id - ${id}`);
                return id;
            })

            let ids = await Promise.all(checkExistActors);
            formatedActors = formatedActors.concat(ids);
        }


        return formatedActors;
    }

}