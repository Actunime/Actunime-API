import { ClassType, Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { Prop, ReturnModelType, types } from "@typegoose/typegoose";
import { MediaLink, MediaPersonGender, MediaPersonOrCharacterName, MediaSearchLogic } from "../../utils/_media.types";
import { FilterQuery } from "mongoose";
import { IMedia } from "../../utils/_media.base";

@ObjectType()
export class Person {

    @Field(type => MediaPersonOrCharacterName)
    @Prop(({ type: MediaPersonOrCharacterName }))
    name!: MediaPersonOrCharacterName

    @Field({ nullable: true })
    @Prop()
    age?: number

    @Field({ nullable: true })
    @Prop()
    birthDate?: string

    @Field(type => MediaPersonGender, { nullable: true })
    @Prop({ enum: MediaPersonGender })
    gender?: MediaPersonGender;

    @Field({ nullable: true })
    @Prop()
    bio?: string

    @Field({ nullable: true })
    @Prop()
    image?: string

    @Field(_ => MediaLink, { nullable: true })
    @Prop({ type: MediaLink })
    links?: MediaLink[]

}

export enum PersonrRoleRelationLabel {
    // Voix
    DOUBLAGE_SEIYU = "DOUBLAGE_SEIYU",
    // Production Anime
    EDITEUR = "EDITEUR",
    PRODUCTEUR = "PRODUCTEUR",
    REALISATEUR = "REALISATEUR",
    REALISATEUR_EPISODES = "REALISATEUR_EPISODES",
    REALISATEUR_MISEENPAGE = "REALISATEUR_MISEENPAGE",
    DIRECTEUR_ARTISTIQUE_CINEMATROGRAPHIQUE = "DIRECTEUR_ARTISTIQUE_CINEMATROGRAPHIQUE",
    DIRECTEUR_ANIMATION = "DIRECTEUR_ANIMATION",
    CONCEPTEUR = "CONCEPTEUR",
    ANIMATEUR_PRINCIPAL = "ANIMATEUR_PRINCIPAL",
    ANIMATEUR_INTERMEDIAIRE = "ANIMATEUR_INTERMEDIAIRE",
    COLORISTES = "COLORISTES",
    DIRECTEUR_ENREGISTREMENT = "DIRECTEUR_ENREGISTREMENT",
    SCENARISTE = "SCENARISTE",
    ANIMATEUR_3D = "ANIMATEUR_3D",
    METTEUR_EN_SCENE = "METTEUR_EN_SCENE",
    SUPERVISEUR = "SUPERVISEUR",
    MONTEUR = "MONTEUR",
    RESPONSABLE_DROITS = "RESPONSABLE_DROITS",
    PRODUCTEUR_MUSIQUE = "PRODUCTEUR_MUSIQUE",
    RESPONSABLE_MARKETING = "RESPONSABLE_MARKETING",
    DIFFUSEUR = "DIFFUSEUR",
    STORYBOARDER = "STORYBOARDER",
    ARTISTE_VFX = "ARTISTE_VFX",
    INGENIEUR_SON = "INGENIEUR_SON",
    DIRECTEUR_DOUBLAGE = "DIRECTEUR_DOUBLAGE",
    TRADUCTEUR = "TRADUCTEUR",
    // Production Manga
    MANGAKA = "MANGAKA",
    CHARACTER_DESIGNER = "CHARACTER_DESIGNER",
    DESSINATEUR_DECORS = "DESSINATEUR_DECORS",
    REALISATEUR_MISE_EN_PAGE = "REALISATEUR_MISE_EN_PAGE",
    // Production Musique
    COMPOSITEUR = "COMPOSITEUR",
    PAROLIER = "PAROLIER",
    ARRANGEUR = "ARRANGEUR",
    MUSICIEN = "MUSICIEN",
    CHANTEUR = "CHANTEUR",
    CHANTEUSE = "CHANTEUSE",
    CHEF_ORCHESTRE = "CHEF_ORCHESTRE",
    PRODUCTEUR_MUSICAL = "PRODUCTEUR_MUSICAL",
    DESIGNER_SONORE = "DESIGNER_SONORE",
    MIXEUR = "MIXEUR"
}


registerEnumType(PersonrRoleRelationLabel, {
    name: 'PersonRelationLabel'
})


@InputType()
export class PersonSearchQuery {
    @Field({ nullable: true })
    name?: string;

    static async dynamicPopulate(this: types.QueryHelperThis<ClassType<IMedia<Person>>, PersonCustomQuery>, info: any) {
        if (!info) return this;
        // const projection = Object.fromEntries(Object.keys(fieldsProjection(info)).map(key => [key, 1]));

        // const staffsRelations = Object.keys(projection).filter(key => key.includes('.actors.'))
        // if (staffsRelations.length) {
        //     this?.populate({
        //         path: 'data.actors.person',
        //     })
        // }

        return this;
    }

    static parse<TModel extends new (...args: any) => any>(props: PersonSearchQuery | null, logic?: MediaSearchLogic, model?: TModel) {
        let query: FilterQuery<ReturnModelType<TModel, PersonCustomQuery>>[] = [];
       
        if (!props) return {};

        if (props.name)
            query = query.concat([
                { "data.name.first": { "$regex": props.name, "$options": "i" } },
                { "data.name.end": { "$regex": props.name, "$options": "i" } },
                { "data.name.alias": { "$regex": props.name, "$options": "i" } },
            ])

        switch (logic) {
            case MediaSearchLogic.OR:
                query = [{ $or: query }]
                return query[0];

            case MediaSearchLogic.AND:
                query = [{ $and: query }]
                return query[0]

            default:
                query = [{ $or: query }]
                return query[0];
        }
    }

    static queryParse(this: types.QueryHelperThis<ClassType<Person>, PersonCustomQuery>, props: PersonSearchQuery, logic: MediaSearchLogic) {
       
        const query = PersonSearchQuery.parse(props, logic);

        this.setQuery(query as any);

        return this;
    }


    static genProjection(props: PersonSearchQuery) {
        let projections: { [key: string]: any } = {};

        return projections;
    }
}

export interface PersonCustomQuery {
    queryParse: types.AsQueryMethod<typeof PersonSearchQuery.queryParse>;
    dynamicPopulate: types.AsQueryMethod<typeof PersonSearchQuery.dynamicPopulate>;
}