import { PersonModel } from "../persons/_Person.models";
import { NewPersonEntry } from "../persons/_Person.newEntry";
import { CharacterModel } from "./_Character.models";
import { CharacterGraphqlProps, ICharacterActorsGraphql } from "./_Character.types";
import { Document } from "mongoose";




export class NewCharacterEntry {

    public name?: {
        start: string,
        end: string,
        alias: string[]
    }
    public age?: number;
    public birthDate?: string;
    public gender?: string;
    public species?: string;
    public bio?: string;
    public image?: string;
    public actors?: number[]

    public document?: Document;
    public documentsToSave: (Document | undefined)[] = [];

    public async init(props: CharacterGraphqlProps) {

        this.name = props.name;
        this.age = props.age;
        this.birthDate = props.birthDate;
        this.gender = props.gender;
        this.species = props.species;
        this.bio = props.bio;
        this.image = props.image;
        this.actors = await this.handleActorsGraphql(props.actors);

        this.document = new CharacterModel({
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

    private async handleActorsGraphql(props?: ICharacterActorsGraphql): Promise<number[]> {
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

        const ActorsIds: number[] = [
            ...news.map((d) => d.document?._id),
            ...olds
        ]

        return ActorsIds;
    }

    private addDocumentsToSave(documents: (Document | undefined)[]) {

        this.documentsToSave = this.documentsToSave.concat(documents);
    }


    public toJSON() {
        return {
            name: this.name,
            age: this.age,
            birthDate: this.birthDate,
            gender: this.gender,
            species: this.species,
            bio: this.bio,
            image: this.image,
            actors: this.actors,
        }
    }
}