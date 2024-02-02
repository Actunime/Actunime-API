import { Index, Prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { Arg, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { DataVirtual, genPublicID } from "../utils";



@Index({ pubId: 'text' }, { unique: true })
@ObjectType()
export class Groupe {
    @Prop({ required: true, default: () => genPublicID() })
    @Field()
    pubId!: string;

    @Prop({ required: true, unique: true })
    @Field()
    name!: string;

    @Prop({ required: true, default: () => Date.now() })
    @Field()
    updatedAt!: Date;

    @Prop({ required: true, default: () => Date.now() })
    @Field()
    createdAt!: Date;
}

@ObjectType()
class GroupeUpdateOutput {
    @Field(type => String, { nullable: true })
    message?: string | null;
    @Field(type => String, { nullable: true })
    pubId?: string | null;
    @Field(type => String, { nullable: true })
    name?: string | null;
    @Field(type => String, { nullable: true })
    error?: string | null;
}


@Resolver(Groupe)
export class GroupeResolver {

    @Query(type => Groupe, { nullable: true })
    async getGroupe(@Arg('groupeId', () => String) groupeId: string): Promise<Groupe | null> {

        const findGroupe = await GroupeModel
            .findOne({ pubId: groupeId })
            .select('pubId name updatedAt createdAt')

        if (!findGroupe) {
            return null
        }

        return findGroupe.toJSON()
    }

    @Query(type => [Groupe], { nullable: true })
    async searchGroupe(@Arg('search', () => String, { nullable: true }) search: string): Promise<Groupe[] | null> {

        const searchIncludesName = new RegExp(search, 'i');

        const findGroupe = await GroupeModel.find({
            $or: [
                { "name": searchIncludesName }
            ]
        }).select('pubId name updatedAt createdAt');

        if (!findGroupe) {
            return null
        }

        const listeGroupe = findGroupe.map(f => f.toJSON());

        console.log(listeGroupe);

        return listeGroupe;

    }

    @Mutation(_ => GroupeUpdateOutput)
    async createGroupe(@Arg('name', () => String) name: string): Promise<GroupeUpdateOutput> {
        try {
            const groupe = await GroupeModel.create({
                name
            })

            return {
                message: `Le groupe ${name} a bien été créé !`,
                pubId: groupe.pubId,
                name
            }
        } catch (err) {
            console.error(err);

            return {
                message: `${err?.toString()}`,
                pubId: null,
                name
            }
        }
    }

    /** ANIME MODEL CIRCULAIRE */


    // @Mutation(_ => GroupeUpdateOutput)
    // async assignGroupeToAnime(@Arg('groupeId', () => String) groupeId: string, @Arg('animeId', () => String) animeId: string): Promise<GroupeUpdateOutput> {

    //     const findGroupe = await GroupeModel.findOne({ pubId: groupeId });

    //     if (!findGroupe) {
    //         return {
    //             message: `Le groupe que vous avez spécifié n'existe pas.`,
    //             pubId: null,
    //             name: null
    //         }
    //     }

    //     const findAnime = await AnimeModel.findOne({ pubId: animeId });

    //     if (!findAnime) {
    //         return {
    //             error: `L'anime que vous avez spécifié n'existe pas.`,
    //             pubId: null,
    //             name: null
    //         }
    //     }


    //     findAnime.updates.push({
    //         data: {
    //             groupe: findGroupe.pubId,
    //         },
    //         // moderator: null,
    //         createdAt: new Date()
    //     })

    //     await findAnime.save();

    //     return {
    //         message: `Le groupe ${findGroupe.name} a bien été assigné a l'anime ${findAnime.data?.title?.default}.`,
    //         pubId: findGroupe.pubId,
    //         name: findGroupe.name
    //     }

    // }


    // @Mutation(_ => GroupeUpdateOutput)
    // async removeGroupeToAnime(@Arg('animeId', () => String) animeId: string): Promise<GroupeUpdateOutput> {

    //     const findAnime = await AnimeModel.findOne({ pubId: animeId });

    //     if (!findAnime) {
    //         return {
    //             error: `L'anime que vous avez spécifié n'existe pas.`,
    //             pubId: null,
    //             name: null
    //         }
    //     }

    //     if (!findAnime.data?.groupe) {
    //         return {
    //             error: `Aucun groupe n'est assigné a cet Anime.`,
    //             pubId: null,
    //             name: null
    //         }
    //     }

    //     await findAnime.populate({ path: "data.groupe" })


    //     findAnime.updates.push({
    //         data: {
    //             groupe: undefined,
    //         },
    //         // moderator: null,
    //         createdAt: new Date()
    //     })

    //     await findAnime.save();

    //     return {
    //         message: `Le groupe ${findAnime.data.groupe instanceof Groupe ? findAnime.data.groupe.name : findAnime.data.groupe} a bien été retiré de l'anime ${findAnime.data?.title?.default}.`,
    //         pubId: null,
    //         name: null
    //     }

    // }

}


@ObjectType()
@modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class GroupeRelation extends DataVirtual(Groupe) {
    @Field()
    @Prop({ required: true })
    pubId!: string;
}




export const GroupeModel = getModelForClass<typeof Groupe>(Groupe, { schemaOptions: { toJSON: { virtuals: true } } })