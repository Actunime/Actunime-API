import { getModelForClass } from "@typegoose/typegoose";
import { ClassType, ObjectType } from "type-graphql";
import { User, CustomQuery } from "./_user.type";
import { PaginationOutput } from "../../utils";

@ObjectType()
export class UserPaginationOutput extends PaginationOutput<User>(User) { }

export const UserModel = getModelForClass<ClassType<Omit<User, 'id'>>, CustomQuery>(User, { schemaOptions: { toJSON: { virtuals: true } } });
