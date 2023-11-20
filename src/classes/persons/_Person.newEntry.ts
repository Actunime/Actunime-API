import { Document } from "mongoose";
import { PersonGraphqlProps } from "./_Person.types";
import { PersonModel } from "./_Person.models";



export class NewPersonEntry {

    public name?: {
        start: string,
        end: string,
        alias: string[]
    }
    public age?: number
    public birthDate?: string
    public gender?: string
    public bio?: string
    public image?: string
    public wikiUrl?: string

    public document?: Document;

    public async init(props: PersonGraphqlProps) {
        this.name = props.name;
        this.age = props.age;
        this.birthDate = props.birthDate;
        this.gender = props.gender;
        this.bio = props.bio;
        this.image = props.image;
        this.wikiUrl = props.wikiUrl;

        this.document = new PersonModel({
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


    public toJSON() {
        return {
            name: this.name,
            age: this.age,
            birthDate: this.birthDate,
            gender: this.gender,
            bio: this.bio,
            image: this.image,
            wikiUrl: this.wikiUrl,
        }
    }
}