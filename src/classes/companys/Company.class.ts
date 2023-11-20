import { Document } from 'mongoose';
import { CompanyRequestModel } from './Company.db';
import { CompanyGraphqlProps } from './Companys.types';
import { CompanyModel } from './_Company.models';

export interface CompanyClassProps {
    _id?: number
    id?: number,
    label?: 'studio' | 'producer'
    name?: string
    siteUrl?: string
    createdDate?: Date
    createdAt?: Date
    editedAt?: Date
}

export class CompanyClass {
    public data?: CompanyClassProps;

    public document: Document<unknown, any, CompanyClassProps> & Omit<CompanyClassProps & Required<{ _id: number; }>, never>;


    constructor(props?: CompanyClassProps) {
        this.data = props;

        this.document = new CompanyRequestModel(this.data);
    }
    onSave
    public async init() {
        this.setDocument();
        await this.document.validate();
    }

    public setDocument() {
        this.document = new CompanyRequestModel(this.data);
    }


}
