import { ClassType, Field, InputType, ObjectType } from "type-graphql";

@InputType({ description: "Pagination options" })
class Pagination {
    @Field({ nullable: true, description: "Page a retourné" })
    page!: number;
    @Field({ nullable: true, description: "Limite résultats" })
    limit!: number;
}

export interface PaginationMediaType {
    page: number;
    pageCount: number;
    pageResultsCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    results: any[];
    resultsLimit: number;
    resultsCount: number;
    ms?: number;
}

function PaginationMedia<TData extends object>(DataClass: ClassType<TData>) {
    @ObjectType({ description: "Pagination responses" })
    abstract class PaginationMedia {
        @Field({ nullable: true })
        page!: number;
        @Field({ nullable: true })
        pageCount!: number;
        @Field({ nullable: true })
        pageResultsCount!: number;
        @Field({ nullable: true })
        hasNextPage!: boolean;
        @Field({ nullable: true })
        hasPrevPage!: boolean;
        @Field(_ => [DataClass], { nullable: true, defaultValue: [] })
        results!: TData[];
        @Field({ nullable: true })
        resultsLimit!: number;
        @Field({ nullable: true })
        resultsCount!: number;
        @Field()
        ms?: number;
    }
    return PaginationMedia;
}

export {
    Pagination,
    PaginationMedia
}