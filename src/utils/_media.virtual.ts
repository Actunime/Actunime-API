import { Prop, Ref } from "@typegoose/typegoose";
import { ClassType, Field, ObjectType } from "type-graphql";




export function DataVirtual<TMedia extends object>(Media: ClassType<TMedia>) {
    @ObjectType()
    abstract class DataVirtual {
        // @Field(_ => Media)
        @Prop({ ref: () => Media, foreignField: 'pubId', localField: 'pubId', justOne: true })
        vData?: Ref<TMedia>;

        @Field(_ => Media)
        public get data() {
            if (this.vData) {
                let data = (this.vData as unknown as any).data;
                // this.vData = undefined;
                return data;
            }
            return null;
        }
    }

    return DataVirtual;
}
