import { Authorized, ClassType, Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { MediaSearchLogic } from "../../utils/_media.types";
import { FilterQuery } from "mongoose";
import { ModelOptions, Prop, QueryMethod, types } from "@typegoose/typegoose";

export enum IUserRoles {
    ACTUNIME = "ACTUNIME",
    ADMIN = "ADMIN",
    MODERATEUR = "MODERATEUR",
    MEMBRE = "MEMBRE"
}

registerEnumType(IUserRoles, {
    name: "IUserRoles",
    description: "Type d'utilisateur"
})

@ObjectType()
class IUserImages {
    @Field()
    @Prop()
    avatar?: String

    @Field()
    @Prop()
    banner?: String
}


@InputType()
export class UserSearchQuery {

    @Field({ nullable: true })
    username!: string;

    @Field({ nullable: true })
    displayName?: string;

    @Field(_ => [IUserRoles], { nullable: true })
    roles!: IUserRoles[];

    @Field(_ => Number, { nullable: true })
    lastActivitySinceSeconds!: number;

    static queryParse(this: types.QueryHelperThis<ClassType<User>, CustomQuery>, props: UserSearchQuery, logic: MediaSearchLogic) {

        console.log('qprops', props);

        let query: FilterQuery<User>[] = [];
        const excludesKeyFromAuto: (keyof typeof props)[] = ['lastActivitySinceSeconds']

        for (const key in props) {
            if (excludesKeyFromAuto.includes(key as any))
                continue;
            if (Object.prototype.hasOwnProperty.call(props, key)) {
                const value = props[key as keyof typeof props];
                if (Array.isArray(value))
                    for (let i = 0; i < value.length; i++)
                        query.push({ [key]: { $regex: value[i], $options: 'i' } })
                else
                    query.push({ [key]: { $regex: value, $options: 'i' } })
            }
        }

        if (props.lastActivitySinceSeconds) {
            const lastSince = new Date(Date.now() - props.lastActivitySinceSeconds * 1000)
            query.push({ 'lastActivity': { $gte: lastSince } })
        }

        switch (logic) {
            case MediaSearchLogic.OR:
                if (query.length) this.or(query)
                break;

            case MediaSearchLogic.AND:
                if (query.length) this.and(query)
                break;

            default:
                if (query.length) this.or(query)
                break;
        }

        console.log('query', this.getQuery())

        return this;
    }

    static genProjection(props: UserSearchQuery) {
        let projections: { [key: string]: any } = {};

        return projections;
    }

}

export interface CustomQuery {
    queryParse: types.AsQueryMethod<typeof UserSearchQuery.queryParse>;
}

@ObjectType({ description: "User" })
@ModelOptions({ schemaOptions: { _id: false } })
class UserAccount {
    @Prop()
    providerAccountId!: string
    @Prop()
    provider!: string
    @Prop()
    type!: string
}

class UserSession {
    @Prop()
    sessionToken!: string
    @Prop()
    expires!: Date
    @Prop()
    device?: string
}


/** User type */
@QueryMethod(UserSearchQuery.queryParse)
@ObjectType({ description: "User" })
@ModelOptions({ schemaOptions: { _id: false, id: false, toJSON: { virtuals: true }, timestamps: true } })
export class User {

    @Field()
    @Prop()
    id!: string;

    //! Privé non servi par gql
    @Prop()
    email!: string;

    @Field({ nullable: true })
    @Prop()
    username!: string;

    @Field({ nullable: true })
    @Prop()
    displayName?: string;

    @Field({ nullable: true })
    @Prop()
    bio?: string;

    @Field(type => [IUserRoles], { nullable: true })
    @Prop({ type: [String] })
    roles!: IUserRoles[];

    @Field(type => IUserImages, { nullable: true })
    @Prop({ type: IUserImages })
    image?: IUserImages;

    //! Privé non servi par gql
    @Prop({ type: [UserAccount], default: undefined })
    accounts?: UserAccount[]

    //! Privé non servi par gql
    @Prop({ type: [UserSession], default: undefined })
    sessions?: UserSession[]

    @Authorized(["admin", "moderateur"])
    @Field({ nullable: true })
    @Prop()
    verified!: Date

    @Authorized(["admin", "moderateur"])
    @Field(type => Date, { nullable: true })
    @Prop({ type: Date })
    // TODO: LastActivityAt ? c'est pas mieux ?
    lastActivity?: Date;
}
