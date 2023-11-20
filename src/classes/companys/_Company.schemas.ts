import { Schema } from "mongoose";
import { CompanyInDB, CompanyProps } from "./Companys.types";
import { AutoIncrementIds } from "../../lib/mongoosePlugin";


export const CompanySchema = new Schema<CompanyProps>({
    // id: { type: Number, required: false },
    label: String,
    name: String,
    siteUrl: String,
});

const UpdateSchema = new Schema({
    data: CompanySchema,
    createdAt: Date,
    author: Number,
    moderator: Number,
    visible: Boolean,
    deletedReason: String,
    deletedAt: Date
})

const UpdateRequestSchema = new Schema({
    versionId: Number,
    data: CompanySchema,
    requestDate: Date,
    author: Number,
    status: String,
    rejectedReason: String,
    acceptNewUpdateFromAuthor: Boolean,
    deletedAt: Date
})

export const CompanySchemaV2 = new Schema<CompanyInDB>({
    id: Number,
    updates: [UpdateSchema],
    updatesRequests: [UpdateRequestSchema],
    visible: Boolean
})


CompanySchemaV2.plugin(AutoIncrementIds.bind(null, 'companyRequest'))