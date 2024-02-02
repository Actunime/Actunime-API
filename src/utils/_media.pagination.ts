import { ClassType, Field, InputType, ObjectType } from "type-graphql";

@InputType({ description: "Pagination options" })
class Pagination {
    @Field({ nullable: true, description: "Page a retourné" })
    page!: number;
    @Field({ nullable: true, description: "Limite résultats" })
    limit!: number;
}

export interface PaginationOutputType {
    currentPage: number;
    totalPage: number;
    limitPerPage: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    results: any[];
    ms?: number;
}

function PaginationOutput<TData extends object>(DataClass: ClassType<TData>) {
    @ObjectType({ description: "Pagination responses" })
    abstract class PaginationOutput {
        @Field({ nullable: true })
        currentPage!: number;
        @Field({ nullable: true })
        totalPage!: number;
        @Field({ nullable: true })
        limitPerPage!: number;
        @Field({ nullable: true })
        totalResults!: number;
        @Field({ nullable: true })
        hasNextPage!: boolean;
        @Field({ nullable: true })
        hasPrevPage!: boolean;
        @Field(_ => [DataClass], { nullable: true, defaultValue: [] })
        results!: TData[];
        @Field()
        ms?: number;
    }
    return PaginationOutput;
}

export {
    Pagination,
    PaginationOutput
}