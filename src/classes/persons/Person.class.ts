import { Document } from 'mongoose';
import { PersonRequestModel } from './Person.db';

export interface PersonClassProps {
    _id?: number;
    id?: number;
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

export class PersonClass {
    public data?: PersonClassProps;

    public document: Document<unknown, any, PersonClassProps> & Omit<PersonClassProps & Required<{ _id: number; }>, never>;

    constructor(props?: PersonClassProps) {
        this.data = props;

        this.document = new PersonRequestModel(this.data);
    }

    public async init() {
        this.setDocument();
        await this.document.validate();
    }

    public setDocument() {
        this.document = new PersonRequestModel(this.data);
    }

}