

type MediaTitle = {
    romaji?: string
    english?: string
    french?: string
    native?: string
    alias?: string[]
}

type PersonName = {
    first: string
    end: string
    alias: string[]
}

type PersonGender = "BOY" | "GIRL";

type MediaDate = {
    start?: Date
    end?: Date
}

type MediaImage = {
    poster?: string
    banner?: string
}

type MediaSource =
    "MANGA" |
    "MANHWA" |
    "MANHUA" |
    "LIGHT_NOVEL" |
    "VISUAL_NOVEL" |
    "WEB_NOVEL" |
    "ORIGINAL" |
    "GAME" |
    "ANIME"

type MediaStatus =
    "AIRING" |
    "PAUSED" |
    "ENDED" |
    "STOPPED" |
    "POSTPONED" |
    "COMMING_SOON"


type MediaTag = {
    name: string
    votes?: number
    spoil?: boolean
}
type MediaTagInput = {
    name: string
    votes: string[]
    spoil: boolean
}

type MediaLink = {
    name?: string
    value?: string
}

type MediaRelationLabel =
    "PREQUEL" |
    "SEQUEL" |
    "SIDEQUEL" |
    "SPIN_OFF" |
    "SOURCE" |
    "ADAPTATION"

type Pagination = {
    offset?: number
    length?: number
}

// enum DataListConfigStatus {
//     WATCHING,
//     READING,
//     PAUSED,
//     PLANNING,
//     DROPPED
// }

export type {
    MediaTitle,
    PersonName,
    PersonGender,
    MediaDate,
    MediaImage,
    MediaSource,
    MediaStatus,
    MediaTag,
    MediaTagInput,
    MediaLink,
    MediaRelationLabel,
    Pagination,
}