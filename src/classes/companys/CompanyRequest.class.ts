import { Document } from 'mongoose';
import { CompanyClass } from './Company.class';

export interface CompanyRequestClassProps {
    _id?: number
    id?: number,
    label?: 'studio' | 'producer'
    name?: string
    siteUrl?: string
    createdDate?: Date
}

export class CompanyRequestClass {

    public data?: CompanyRequestClassProps

    public formated: CompanyClass = new CompanyClass();

    public unsavedDocument: Document<any>[] = [];

    constructor(props?: CompanyRequestClassProps) {
        this.data = props;
    }

    public async init() {

        this.formated.data = this.data;

        await this.formated.init();

        this.unsavedDocument.push(this.formated.document);
    }

}