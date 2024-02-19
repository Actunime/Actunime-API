import { ClassType, Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { Prop, modelOptions, types } from "@typegoose/typegoose";
import { MediaLink, MediaPersonGender, MediaPersonOrCharacterName, MediaSearchLogic } from "../../utils/_media.types";
import { DataVirtual } from "../../utils";
import { FilterQuery } from "mongoose";
import { Base } from "../../utils/_media.base";

@ObjectType()
export class Person extends Base('Person') {

    @Field(type => MediaPersonOrCharacterName)
    @Prop(({ type: MediaPersonOrCharacterName }))
    name!: MediaPersonOrCharacterName

    @Field()
    @Prop()
    age?: number

    @Field()
    @Prop()
    birthDate?: string

    @Field(type => MediaPersonGender)
    @Prop({ enum: MediaPersonGender })
    gender?: MediaPersonGender;

    @Field()
    @Prop()
    bio?: string

    @Field()
    @Prop()
    image?: string

    @Field(_ => MediaLink)
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


@ObjectType()
@modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class PersonRelation extends DataVirtual(Person) {
    @Field()
    @Prop()
    id!: string;
    @Field()
    @Prop()
    label?: PersonrRoleRelationLabel;;
}


@InputType()
export class PersonSearchQuery {
    @Field({ nullable: true })
    name?: string;

    static queryParse(this: types.QueryHelperThis<ClassType<Person>, PersonCustomQuery>, props: PersonSearchQuery, logic: MediaSearchLogic) {
        let query: FilterQuery<Person>[] = [];

        if (props.name)
            query.push({ "data.name": { "$regex": props.name, "$options": "i" } })

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

    static genProjection(props: PersonSearchQuery) {
        let projections: { [key: string]: any } = {};

        return projections;
    }
}

export interface PersonCustomQuery {
    queryParse: types.AsQueryMethod<typeof PersonSearchQuery.queryParse>;
}