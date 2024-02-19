import { ModelOptions, Prop, Index, Pre, QueryMethod } from "@typegoose/typegoose";
import { ObjectType, Field, ClassType, registerEnumType } from "type-graphql";
import { createDataFromUpdate } from "./_genMediaFromUpdate";
import { genPublicID } from "./_genPublicId";


enum UpdateStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    DELETED = "DELETED"
}

registerEnumType(UpdateStatus, {
    name: "UpdateStatus"
})

export type MediaRequiredFields = 'id' | 'createdAt' | 'updatedAt' | 'verifiedBy' | 'verified' | 'deleted';

export interface IUpdate<TMedia extends object, TChanges extends IMedia<TMedia> = IMedia<TMedia>> {
    id?: string;
    changes: Partial<TChanges>
    status?: UpdateStatus
    author: string
    verifiedBy?: string;
    verified?: boolean;
    deletedAt?: Date;
    deleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IMedia<TMedia extends object> {
    id: string;
    data: Partial<TMedia> | null;
    updates: IUpdate<TMedia>[]
    verifiedBy?: string;
    verified?: boolean;
    deletedAt: Date;
    deleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const inited = [];

export function Base(modelName?: string, options?: { _id?: boolean, id?: boolean }) {
    console.log('base', modelName)
    @ModelOptions({
        options: { customName: modelName },
        schemaOptions: {
            timestamps: true,
            id: false,
            ...options,
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        }
    })
    @ObjectType()
    abstract class Base {
        @Field()
        id!: string;
        // En tant que staff je veut savoir qui a vérifié la mise à jour
        @Prop()
        @Field(_ => String)
        verifiedBy!: string

        // En tant que staff je veut savoir si la mise a jour est vérifié ou non
        //? Virtuals
        // @Prop({ type: Boolean })
        @Field(_ => Boolean)
        public get verified() {
            return !!this.verifiedBy && !this.deleted
        }

        // public set verified(verified: boolean) {
        //     this.verified = verified;
        // }

        // En tant que staff je veut savoir qui a supprimé la mise à jour
        @Prop()
        @Field()
        deletedAt?: Date;

        // En tant que staff je veut savoir si une mise a jour a été supprimé ou non
        // @Prop()
        @Field(_ => Boolean)
        public get deleted() {
            return !!this.deletedAt
        }

        // public set deleted(deleted: boolean) {
        //     this.deleted = deleted;
        // }

        @Prop()
        @Field()
        createdAt!: Date;

        @Prop()
        @Field()
        updatedAt!: Date;
    }

    return Base;
}

export function Media<TMedia extends object & { id: string, createdAt: Date, updatedAt: Date }>(ClassMedia: ClassType<TMedia>, queryParse?: (...args: any) => any) {
    console.log('Media Init', ClassMedia?.name);

    // @ModelOptions({ schemaOptions: { timestamps: true, id: false, _id: false } })
    @ObjectType(ClassMedia.name + "Update")
    abstract class Update extends Base(ClassMedia.name + "Update", { _id: false, id: false }) {
        @Prop({ required: true, default: () => genPublicID() })
        @Field()
        id!: string;

        @Prop({ type: ClassMedia, _id: false })
        @Field(_ => ClassMedia)
        changes!: Required<Pick<Partial<TMedia>, 'id' | 'createdAt' | 'updatedAt'>> & Partial<TMedia>

        @Prop({ enum: UpdateStatus, default: UpdateStatus.PENDING })
        @Field(_ => UpdateStatus)
        status!: UpdateStatus

        @Prop()
        @Field()
        author!: string
    }

    let index: { [key: string]: 'text' } | undefined = undefined

    switch (ClassMedia.name) {
        case 'Anime':
            index = { 'data.title.romaji': 'text', 'data.title.native': 'text', 'data.title.alias': 'text' }
            break;
        case 'Character':
            index = { 'data.name.first': 'text', 'data.name.end': 'text', 'data.name.alias': 'text' }
            break;
        case 'Person':
            index = { 'data.name.first': 'text', 'data.name.end': 'text', 'data.name.alias': 'text' }
            break;
        case 'Company':
            index = { 'data.name': 'text' }
            break;
        case 'Track':
            index = { 'data.name': 'text' }
            break;
        case 'Groupe':
            index = { 'data.name': 'text' }
            break;
    }

    @QueryMethod(queryParse || (() => { }))
    @Pre<Media>('save', function (next) {
        this.data = createDataFromUpdate<Required<Pick<Partial<TMedia>, 'id' | 'createdAt' | 'updatedAt'>> & Partial<TMedia>, Pick<Update, 'changes' | 'createdAt'>>(
            this.updates.filter((u: any) => u.toJSON().verified),
            this.id
        );
        next()
    })
   
    @Index(index as any)
    @ObjectType(ClassMedia.name + "Media", { description: ClassMedia.name })
    class Media extends Base(ClassMedia.name) {
        @Prop({ required: true, default: () => genPublicID(), unique: true })
        @Field()
        id!: string;

        // En tant qu'utilisateur je veut récupérer les informations complètes d'un "media"
        @Prop({ type: ClassMedia })
        @Field(_ => ClassMedia)
        data!: Required<Pick<Partial<TMedia>, 'id' | 'createdAt' | 'updatedAt'>> & Partial<TMedia> | null;

        public get rawData() {
            // Juste pour tester le retour du champ data en mode non vérifié
            return createDataFromUpdate(this.updates.map((u: any) => u.toJSON()), this.id) as TMedia
        }

        // En tant que staff je veut récupérer la liste des modifications d'un "media"
        @Prop({ type: [Update], default: [] })
        @Field(_ => [Update])
        updates!: Update[]

    }

    return Media;
}