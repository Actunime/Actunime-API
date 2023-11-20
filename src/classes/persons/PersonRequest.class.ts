import { Document } from 'mongoose';
import { PersonRequestModel } from './Person.db';
import { PersonClass } from './Person.class';

export interface PersonRequestClassProps {
    _id?: number;
    id?: number,
    name?: {
        start: string,
        end: string,
        alias: string[]
    }
    age?: number,
    birthDate?: string,
    gender?: string,
    bio?: string,
    image?: string,
    wikiUrl?: string
}

export class PersonRequestClass {

    public data?: PersonRequestClassProps

    public formated: PersonClass = new PersonClass();

    public document: Document<unknown, any, PersonRequestClassProps> & Omit<PersonRequestClassProps & Required<{ _id: number; }>, never>;

    public unsavedDocument: Document<any>[] = [];

    constructor(props: PersonRequestClassProps) {
        for (const key in props) {
            (this[key as keyof this] as any) = props[key as keyof PersonRequestClassProps];
        }

        this.document = new PersonRequestModel(this);
    }

    public async init() {

        this.formated.data = this.data;

        await this.formated.init();

        this.unsavedDocument.push(this.formated.document);
    }

    public setDocument() {
        this.document = new PersonRequestModel(this);
    }

}