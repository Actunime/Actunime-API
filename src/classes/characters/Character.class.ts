import { Document } from 'mongoose';
import { CharacterRequestModel } from './Character.db';

export interface CharacterClassProps {
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
    species?: string,
    bio?: string,
    image?: string,
    actors?: number[]
}

export class CharacterClass {

    public data?: CharacterClassProps;

    public document: Document<unknown, any, CharacterClassProps> & Omit<CharacterClassProps & Required<{ _id: number; }>, never>;

    constructor(props?: CharacterClassProps) {
        this.data = props;

        this.document = new CharacterRequestModel(this.data);
    }

    public async init() {
        this.setDocument();
        await this.document.validate();
    }

    public setDocument() {
        this.document = new CharacterRequestModel(this.data);
    }

}