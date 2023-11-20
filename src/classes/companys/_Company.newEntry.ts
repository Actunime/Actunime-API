import { Document } from "mongoose";
import { CompanyGraphqlProps } from "./Companys.types";
import { CompanyModel } from "./_Company.models";

export class NewCompanyEntry {

    public label?: 'studio' | 'producer'
    public name?: string
    public siteUrl?: string
    public createdDate?: Date

    public document?: Document;

    public async init(props: CompanyGraphqlProps) {
        this.label = props.label;
        this.name = props.name;
        this.siteUrl = props.siteUrl;
        this.createdDate = props.createdDate;

        this.document = new CompanyModel({
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
            label: this.label,
            name: this.name,
            siteUrl: this.siteUrl,
            createdDate: this.createdDate
        }
    }
}