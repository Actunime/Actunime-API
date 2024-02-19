import { Prop, Ref } from "@typegoose/typegoose";
import { ClassType, Field, ObjectType } from "type-graphql";




export function DataVirtual<TMedia extends object>(Media: ClassType<TMedia>) {
    @ObjectType()
    abstract class DataVirtual {
        // @Field(_ => Media)
        @Prop({ ref: () => Media, foreignField: 'id', localField: 'id', justOne: true, default: undefined })
        vData?: Ref<TMedia>;

        @Field(_ => Media, { nullable: true })
        public get data() {
            if (this.vData) {
                let data = (this.vData as unknown as any).data;
                // this.vData = undefined;
                return data;
            }
            return null;
        }

        public set data(data: TMedia | null) {
            // this.data = data;
        }
    }

    return DataVirtual;
}
