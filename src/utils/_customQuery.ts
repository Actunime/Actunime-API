import { types } from "@typegoose/typegoose";
import { ClassType } from "type-graphql";

export interface CustomQuery {
    searchMediaByTitle: types.AsQueryMethod<typeof searchMediaByTitle>;
}

export function searchMediaByTitle<T extends ClassType>(this: types.QueryHelperThis<T, CustomQuery>, title: string) {
    let searchIncludesName = new RegExp(title, 'i');
    return this.find({
        $or: [
            { "data.title.default": searchIncludesName },
            { "data.title.romaji": searchIncludesName },
            { "data.title.native": searchIncludesName },
            { "data.title.alias": { $in: [searchIncludesName] } },
        ]
    })
}