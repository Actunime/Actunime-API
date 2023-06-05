import { UserOutput } from "./user"
import { Pagination } from "./utils"

export type StudioOutput = {
    name: String
    siteUrl: String
    wikiUrl: String
    createdDate: Date
    contributors: (page: Pagination) => UserOutput[];
    createdAt: Date
    editedAt: Date
}