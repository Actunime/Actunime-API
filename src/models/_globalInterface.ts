export type MediaInputAction = "NEW" | "UPDATE" | "DELETE" | "VERIFY";

export type RelationMediaType =
    'ANIME' |
    'MANGA'


export type RelationMediaLabel =
    "PREQUEL" |
    "SEQUEL" |
    "SIDEQUEL" |
    "SPIN_OFF" |
    "SOURCE" |
    "ADAPTATION"

export type RelationInput = {
    type: RelationMediaType
    label: RelationMediaLabel
    _id: number
}

export type RelationOnSaving = {
    label: RelationMediaLabel
    data: number
}

export interface SpecialRelInputRaw<T> {
    label: string,
    data: T
}