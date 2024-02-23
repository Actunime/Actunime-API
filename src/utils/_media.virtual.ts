import { ModelOptions, Prop, Ref } from "@typegoose/typegoose";
import { ClassType, Field, ObjectType } from "type-graphql";




export function DataVirtual<TMedia extends object>(Media: ClassType<TMedia>) {
    @ObjectType()
    @ModelOptions({
        schemaOptions: { toJSON: { virtuals: true }, toObject: { virtuals: true } }
    })
    abstract class DataVirtual {
        // @Field(_ => Media)
        // @Field(_ => Media, { nullable: true })
        // @Prop({ ref: () => Media, foreignField: 'id', localField: 'id', justOne: true, default: undefined })
        // vData?: Ref<TMedia>;

        @Field(_ => Media, { nullable: true })
        @Prop({ ref: () => Media, type: () => String, foreignField: 'id', localField: 'id', justOne: true })
        data!: Ref<TMedia, string>
    }

    return DataVirtual;
}
