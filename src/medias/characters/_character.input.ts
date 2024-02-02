
import { Field, InputType } from "type-graphql";
import { CharacterSpecies, Character, CharacterRelation, CharacterRelationLabel } from './_character.type';
import { MediaPersonOrCharacterNameInput, MediaPersonGender } from "../../utils/_media.types";
import { PersonInput, PersonRelationFields } from "../persons/_person.input";
import { MediaDoc, createUpdate } from "../../utils/_createUpdate";
import { CharacterModel } from "./_character.model";
import { MediaUpdateOptionArg } from "../../utils/_media.update";


@InputType()
export class CharacterInput {

    @Field(type => MediaPersonOrCharacterNameInput)
    name!: MediaPersonOrCharacterNameInput

    @Field()
    age?: number;

    @Field()
    birthDate?: string;

    @Field(type => MediaPersonGender)
    gender?: MediaPersonGender;

    @Field(type => CharacterSpecies)
    species?: CharacterSpecies;

    @Field()
    bio?: string;

    @Field()
    image?: string;

    @Field(type => PersonRelationFields)
    actors?: PersonRelationFields;

    static createUpdate(props: CharacterInput, action: "request" | "direct_update", visible: boolean) {

        const db = CharacterModel;
        let docToSaveWith: MediaDoc[] = [];

        let media: Character = {
            ...props,
            actors: props.actors ? PersonInput.InitFromRelation(props.actors, action, (m) => docToSaveWith = docToSaveWith.concat(m)) : undefined
        };

        if (action === 'direct_update') {
            return createUpdate<Character>({ media, db, visible, docToSaveWith })
        } else {
            return createUpdate<Character>({ media, db, visible, docToSaveWith })
        }
    }

    static InitFromRelation(
        props: CharacterRelationFields,
        action: "request" | "direct_update",
        addModel: (m: MediaDoc[]) => void) {

        let relationOutput: CharacterRelation[] = [];

        if (props.news) {
            for (const relation of props.news) {
                const update = this.createUpdate(relation.data, action, relation.options?.visible === undefined ? true : false);
                let model = update.returnModels()
                relationOutput.push({
                    pubId: model[0].pubId,
                    label: relation.label,
                    data: null
                })
                addModel(model)
            }
        }

        if (props.exists) {
            for (const relation of props.exists) {
                relationOutput.push({
                    pubId: relation.pubId, label: relation.label,
                    data: null
                })
            }
        }

        return relationOutput;
    }
}

@InputType({ description: "Relation Character" })
class CharacterRelationAddInput {
    @Field(_ => CharacterInput)
    data!: CharacterInput;
    @Field(_ => CharacterRelationLabel, { nullable: true })
    label?: CharacterRelationLabel;
    @Field(_ => MediaUpdateOptionArg, { nullable: true })
    options?: MediaUpdateOptionArg
}

@InputType({ description: "Relation Character" })
class CharacterRelationExistInput {
    @Field(_ => String)
    pubId!: string;
    @Field(_ => CharacterRelationLabel, { nullable: true })
    label?: CharacterRelationLabel;
}

@InputType()
export class CharacterRelationFields {
    @Field(_ => [CharacterRelationAddInput])
    news?: CharacterRelationAddInput[]
    @Field(_ => [CharacterRelationExistInput])
    exists?: CharacterRelationExistInput[]
}



const a = {
    "searchQuery": {
        "season": "PRINTEMPS",
        "year": 2019
    },
    "searchLogic": "AND",
    "pagination": {
        "page": 1,
        "limit": 20
    },
    "createAnimeOptions2": {
        "visible": true
    },
    "createAnimeData2": {
        "title": {
            "romaji": null,
            "native": null
        },
        "date": {
            "start": null,
            "end": null
        },
        "image": {
            "poster": null,
            "banner": null
        },
        "synopsis": null,
        "source": {
            "origine": null
        },
        "format": null,
        "vf": null,
        "genres": null,
        "themes": null,
        "status": null,
        "episodes": {
            "airing": null,
            "nextAiringDate": null,
            "total": null,
            "durationMinutePerEp": null
        },
        "adult": null,
        "explicit": null,
        "links": {
            "name": null,
            "value": null
        },


        "companys": {
            "news": [
                {
                    "data": {
                        "label": null,
                        "name": null,
                        "links": [
                            {
                                "name": null,
                                "value": null
                            }
                        ],
                        "createdDate": null
                    },
                    "options": {
                        "visible": null
                    }
                }
            ],
            "exists": [
                {
                    "pubId": null
                }
            ]
        },




        "staffs": {
            "news": [
                {
                    "label": null,
                    "data": {
                        "pubId": null,
                        "links": [
                            {
                                "name": null,
                                "value": null
                            }
                        ],
                        "name": {
                            "first": null,
                            "end": null,
                            "alias": null
                        },
                        "image": null,
                        "id": null,
                        "gender": null,
                        "birthDate": null,
                        "bio": null,
                        "age": null
                    },
                    "options": {
                        "visible": null
                    }
                }
            ],
            "exists": [
                {
                    "pubId": null,
                    "label": null
                }
            ]
        },





        "tracks": {
            "news": [
                {
                    "options": {
                        "visible": null
                    },
                    "label": null,
                    "episodes": null,
                    "data": {
                        "pubId": null,
                        "outDate": null,
                        "name": null,
                        "links": [
                            {
                                "value": null,
                                "name": null
                            }
                        ],
                        "image": null,
                        "id": null,


                        "artists": {
                            "news": [
                                {
                                    "options": {
                                        "visible": null
                                    },
                                    "label": null,
                                    "data": {
                                        "pubId": null,
                                        "name": {
                                            "end": null,
                                            "alias": null,
                                            "first": null
                                        },
                                        "links": [
                                            {
                                                "name": null,
                                                "value": null
                                            }
                                        ],
                                        "image": null,
                                        "id": null,
                                        "gender": null,
                                        "birthDate": null,
                                        "bio": null,
                                        "age": null
                                    }
                                }
                            ],
                            "exists": [
                                {
                                    "pubId": null,
                                    "label": null
                                }
                            ]
                        }


                    }
                }
            ],
            "exists": [
                {
                    "pubId": null,
                    "label": null,
                    "episodes": null
                }
            ]
        },





        "characters": {
            "news": [
                {
                    "options": {
                        "visible": null
                    },
                    "label": null,
                    "data": {
                        "species": null,
                        "pubId": null,
                        "image": null,
                        "name": {
                            "alias": null,
                            "end": null,
                            "first": null
                        },
                        "id": null,
                        "gender": null,
                        "birthDate": null,
                        "bio": null,
                        "age": null,


                        "actors": {
                            "news": [
                                {
                                    "options": {
                                        "visible": null
                                    },
                                    "label": null,
                                    "data": {
                                        "pubId": null,
                                        "name": null,
                                        "links": [
                                            {
                                                "value": null,
                                                "name": null
                                            }
                                        ],
                                        "image": null,
                                        "gender": null,
                                        "birthDate": null,
                                        "bio": null,
                                        "age": null
                                    }
                                }
                            ],
                            "exists": [
                                {
                                    "pubId": null,
                                    "label": null
                                }
                            ]
                        }


                    }
                }
            ],
            "exists": [
                {
                    "pubId": null,
                    "label": null
                }
            ]
        }


    }

}