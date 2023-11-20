import { Model as MongooseModel, model, Schema as MongooseSchema } from 'mongoose';
import AutoIncrement from "../../lib/_autoIncrementPlugin";
import { IUserSchema } from "./_interface";

const Schema = new MongooseSchema<IUserSchema>({
    _id: { type: Number },
    discordID: {
        type: String,
        trim: true,
        unique: true,
        default: undefined
    },
    username: {
        type: String,
        required: [true, "username est requis."],
        trim: true,
        lowercase: true,
        validate:
            [
                {
                    validator: (username: string) => username.length >= 3 && username.length <= 16,
                    message: `Le nom d'utilisateur doit être entre 3 caractères et 16 caractères.`
                },
                {
                    validator: (username: string) => /(\W+)/g.test(username) ? false : true,
                    message: `Le nom d'utilisateur doit contenir que des chiffres et des lettres sans espaces.`
                },
                {
                    validator: async function (this: Function, username: string) {
                        let model = this.constructor as MongooseModel<IUserSchema>;
                        let usernameExist = await model.exists({ username }).exec();
                        return usernameExist === null;
                    },
                    message: `Ce nom d'utilisateur est déjà utilisé.`
                }
            ]

    },
    displayName: {
        type: String,
        required: [true, "displayName est requis."],
        trim: true,
        validate: {
            validator: (value: string) => {
                if (value.length < 1 || value.length > 32) {
                    return false;
                }
                return true;
            },
            message: `Le pseudonyme doit être entre 1 caractères et 32 caractères.`
        }
    },
    email: {
        type: String,
        required: [true, "email est requis."],
        trim: true,
        validate: [
            {
                validator: async function (email: string) {
                    return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email);
                },
                message: (props) => `L'email ${props.value} est invalide.`
            },
            {
                validator: async function (this: Function, email: string) {
                    let model = this.constructor as MongooseModel<IUserSchema>;
                    let emailExist = await model.exists({ email }).exec();
                    return emailExist === null;
                },
                message: (props) => `L'email ${props.value} est déjà utilisé par un autre compte.`
            }
        ]
    },
    password: {
        type: String,
        required: [true, "password est requis."],
        validate: [
            {
                validator: (value: string) => {
                    if (value.length < 5) {
                        return false
                    }
                    return true;
                },
                message: `Votre mot de passe est trop petit.`
            },
            {
                validator: (password: string) => {
                    return /([a-z]+)/g.test(password)
                },
                message: `Votre mot de passe doit contenir au moins 1 caractère alphabétique minuscule.`
            },
            {
                validator: (password: string) => {
                    return /([A-Z]+)/g.test(password)
                },
                message: `Votre mot de passe doit contenir au moins 1 caractère alphabétique majuscule.`
            },
            {
                validator: (password: string) => {
                    return /([0-9]+)/g.test(password)
                },
                message: `Votre mot de passe doit contenir au moins 1 caractère numérique.`
            },
            {
                validator: (password: string) => {
                    return /(\W+)/g.test(password)
                },
                message: `Votre mot de passe doit contenir au moins 1 caractère spécial.`
            }
        ]
    },
    image: {
        avatar: { type: String, default: undefined },
        banner: { type: String, default: undefined },
    },
    animeList: {
        type: [{
            status: { type: String, enum: ["WATCHING", "PAUSED", "PLANNING", "DROPPED"], default: "PLANNING" },
            data: { type: Number, ref: 'anime', required: [true, "L'id de l'anime est nécéssaire."] }
        }]
    },
    mangaList: {
        type: [{
            status: { type: String, enum: ["READING", "PAUSED", "PLANNING", "DROPPED"] },
            data: { type: Number, ref: 'manga', required: [true, "L'id du manga est nécéssaire."] }
        }]
    },
    characterList: {
        type: [{ type: Number, ref: 'character' }],
        default: undefined
    },
    trackList: {
        type: [{ type: Number, ref: 'track' }],
        default: undefined
    },
    personList: {
        type: [{ type: Number, ref: 'person' }],
        default: undefined
    },
    friendList: {
        type: [{ type: Number, ref: 'user' }],
        default: undefined
    },
    followerList: {
        type: [{ type: Number, ref: 'user' }],
        default: undefined
    },
    followingList: {
        type: [{ type: Number, ref: 'user' }],
        default: undefined
    },
    premium: {
        active: { type: Boolean, default: false },
        since: { type: Date, default: undefined },
        end: { type: Date, default: undefined },
    },
    createdAt: { type: Date, required: true },
    editedAt: { type: Date },

    verified: { type: Boolean, default: false }
}, { _id: false, toJSON: { virtuals: true } })

export const dbName = 'users';
export const rowName = dbName.slice(0, -1);

Schema.virtual('updates', {
    ref: 'update',
    localField: '_id',
    foreignField: 'dataID',
});

Schema.virtual('contributions', {
    ref: 'update',
    localField: '_id',
    foreignField: 'user',
});

AutoIncrement.AutoIncrement(Schema, dbName);

const Model = model(rowName, Schema, dbName);

export { Model };