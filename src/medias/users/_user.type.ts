
import { Field, InputType, ObjectType } from "type-graphql";
import { Prop, modelOptions, getModelForClass } from "@typegoose/typegoose";
// import { PaginationOutput } from "../../utils/_media.pagination";

export enum IUserRoles {
    ACTUNIME = "ACTUNIME",
    ADMINISTRATEUR = "ADMINISTRATEUR",
    MODERATEUR = "MODERATEUR",
    MEMBRE = "MEMBRE"
}

@ObjectType()
class IUserImages {
    @Field()
    @Prop()
    avatar?: String

    @Field()
    @Prop()
    banner?: String
}


@ObjectType({ description: "Format Media dans la base de données" })
@modelOptions({ options: { customName: "User" } })
export class User {

    @Field()
    @Prop()
    id!: string;

    @Field()
    @Prop()
    pubId!: string;

    @Field()
    @Prop()
    email!: string;

    @Field()
    @Prop()
    username!: string;

    @Field()
    @Prop()
    discordID?: string;

    @Field()
    @Prop()
    displayName?: string;

    @Field()
    @Prop()
    bio?: string;

    @Field(type => [IUserRoles])
    @Prop({ type: [String] })
    roles!: IUserRoles[];

    @Field(type => IUserImages)
    @Prop({ type: IUserImages })
    image?: IUserImages;

    @Field()
    @Prop()
    updatedAt?: Date;

    @Field()
    @Prop()
    createdAt!: Date;
}


// @ObjectType()
// export class UserPaginationOutput extends PaginationOutput<User>(User) { }

@InputType()
export class UserSearchQuery {
    @Field()
    name!: string;
}

// @ObjectType()
// export class UserRelation {
//     @Field()
//     @Prop()
//     label!: string;
//     @Field(_ => User)
//     @Prop({ type: () => User, refPath: 'pubId', ref: 'User' })
//     data?: string | User;
// }

// @InputType({ description: "Relation User, ajouter une nouvelle société en même temps qu'un nouveau media." })
// class UserRelationAddInput {
//     @Field(_ => UserInput)
//     data!: UserInput;
//     @Field()
//     label!: string;
//     @Field(_ => MediaUpdateOptionArg, { nullable: true })
//     options!: MediaUpdateOptionArg
// }

// @InputType({ description: "Relation User, ajouter une société a un nouveau media." })
// class UserRelationExistInput {
//     @Field(_ => String)
//     pubId!: string;
//     @Field()
//     label!: string;
// }

// @InputType()
// export class UserRelationFields {
//     @Field(_ => [UserRelationAddInput])
//     news!: UserRelationAddInput[]
//     @Field(_ => [UserRelationExistInput])
//     exists!: UserRelationExistInput[]
// }


// @Pre<UserMedia>('save', function (next) {
//     this.data = genMediaFromUpdate<User>(this.updates.filter(u => u.visible));
//     next()
// })

// @ObjectType({ description: "Format Media dans la base de données" })
// @modelOptions({ options: { customName: "User" } })
// export class UserMedia extends MediaFormat<User>(User, UserUpdates, UserRequests) { }

export const UserModel = getModelForClass<typeof User>(User, { schemaOptions: { toJSON: { virtuals: true } } });