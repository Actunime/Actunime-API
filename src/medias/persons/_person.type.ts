import { Field, ObjectType, registerEnumType } from "type-graphql";
import { Prop, Pre, modelOptions, getModelForClass } from "@typegoose/typegoose";
import { MediaLink, MediaPersonGender, MediaPersonOrCharacterName } from "../../utils/_media.types";

// import { MediaUpdateFormat } from "../../utils/_media.update";
// import { MediaRequestFormat } from "../../utils/_media.request";
// import { MediaFormat, MediaFormatOutput } from "../../utils/_media.format";

// import { PaginationOutput } from "../../utils/_media.pagination";
import { genMediaFromUpdate } from "../../utils/_genMediaFromUpdate";
import { DataVirtual } from "../../utils";

// export enum PersonLabel {
//     ARTIST = "ARTIST",
//     ACTEUR = "ACTEUR",
//     STAFF = "STAFF"
// }

// registerEnumType(PersonLabel, {
//     name: "PersonLabel",
//     description: "Type de personne"
// })

@ObjectType()
export class Person {

    @Field()
    @Prop()
    id?: string;

    // @Field(type => PersonLabel)
    // @Prop({type: PersonLabel})
    // label!: PersonLabel

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

    constructor(props: Person) {
        Object.assign(this, props);
    }
}

export enum PersonRelationLabel {
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
    // COMITEPRODUCTION = "COMITEPRODUCTION",
    INGENIEUR_SON = "INGENIEUR_SON",
    DIRECTEUR_DOUBLAGE = "DIRECTEUR_DOUBLAGE",
    TRADUCTEUR = "TRADUCTEUR",
}



registerEnumType(PersonRelationLabel, {
    name: 'PersonRelationLabel'
})


@ObjectType()
@modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class PersonRelation extends DataVirtual(Person) {
    @Field()
    @Prop()
    pubId!: string;
    @Field()
    @Prop()
    label?: string;;
}