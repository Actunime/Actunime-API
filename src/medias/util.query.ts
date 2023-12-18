import { types } from "@typegoose/typegoose";
import { MediaFormat, MediaUpdateFormat } from "./util.type";
import { ClassType } from "type-graphql";


export function genMediaFromUpdate<T>(updates: MediaUpdateFormat<T>[]) {
    const sortedUpdate = updates.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    let data: any = {};
    for (let i = 0; i < sortedUpdate.length; i++) data = { ...sortedUpdate[i].data }
    return data;
}

 interface QueryHelpers {
    searchMediaByTitle: types.AsQueryMethod<typeof searchMediaByTitle>;
}

export function searchMediaByTitle<T extends ClassType>(this: types.QueryHelperThis<T, QueryHelpers>, title: string) {
    let searchIncludesName = new RegExp(title, 'i');
    return this.find({
        $or: [
            { "data.title.default": searchIncludesName },
            { "data.title.romaji": searchIncludesName },
            { "data.title.native": searchIncludesName },
            { "data.title.alias": searchIncludesName },
        ]
    })
}