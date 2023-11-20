import { Error } from "mongoose";
import { Users } from "..";
import JWT from 'jsonwebtoken';

interface userCreateInput {
    email: string,
    password: string,
    username: string,
    displayName: string,
    image: {
        avatar: string,
        banner: string
    }
}

interface userLoginInput {
    email: string,
    password: string
}


class Resolver {

    static Query = {

    }

    static Mutation = {
        createUser: (_: any, a: any, b: any) => this.createUser(a, b),
        logInUser: (_: any, a: any, b: any) => this.logInUser(a, b),
        // userChangeUsername: this.changeUsername,
        // userChangeDisplayName: this.changeDisplayName,
        // userChangeBio: this.changeBio,
        // userAddAnime: this.addAnime,
        // userRemoveAnime: this.removeAnime,
        // userAddManga: this.addManga,
        // userRemoveManga: this.removeManga,
        // userAddCharacter: this.addCharacter,
        // userRemoveCharacter: this.removeCharacter,
        // userAddTrack: this.addTrack,
        // userRemoveTrack: this.removeTrack,
        // userAddPerson: this.addPerson,
        // userRemovePerson: this.removePerson,
        // userSetPremium: this.setPremium,
        // userSetVerified: this.setVerified
    }

    public static async needToBeLogged(input: any, ctx: any) {
        let user = null;
        return user;
    }

    static async logInUser(input: { login: userLoginInput }, ctx: any): Promise<any> {

        let { email, password } = input.login;

        let findUser = await Users.Model.findOne({ email, password });

        if (!findUser) return { message: "L'identifiant ou le mot de passe est incorrecte.", errors: [] };
        let expire = Date.now() + (60000 * 60 * 60);

        let token = JWT.sign({ userID: findUser._id, expireAt: expire }, "privateKey", { algorithm: 'RS256', expiresIn: expire });

        console.log(token);
    }


    static async createUser(input: { user: userCreateInput }, ctx: any) {

        try {

            const { user: newUser } = input;

            const modelCheck = new Users.Model({ ...newUser, createdAt: new Date() });

            await modelCheck.validate();

            await modelCheck.save();

            return {
                message: "L'utilisateur a bien été crée.",
                errors: []
            }

        } catch (err: any) {

            if (err instanceof Error.ValidationError) {
                let errors = [];
                for (const key in err.errors) {
                    errors.push({ key, message: err.errors[key as keyof typeof err.errors].toString() })
                }
                console.error(err)
                return {
                    message: "Vous avez une ou plusieurs erreurs.",
                    errors
                }
            } else {
                console.error(err);

                return {
                    message: "Une erreur s'est produite.",
                    errors: []
                }
            }
        }

    }


    static changeUsername(_: any, input: any, ctx: any) {

    }

    static changeDisplayName(_: any, input: any, ctx: any) {

    }

    static changeBio(_: any, input: any, ctx: any) {

    }

    static addAnime(_: any, input: any, ctx: any) {

    }

    static removeAnime(_: any, input: any, ctx: any) {

    }

    static addManga(_: any, input: any, ctx: any) {

    }

    static removeManga(_: any, input: any, ctx: any) {

    }

    static addCharacter(_: any, input: any, ctx: any) {

    }

    static removeCharacter(_: any, input: any, ctx: any) {

    }

    static addTrack(_: any, input: any, ctx: any) {

    }

    static removeTrack(_: any, input: any, ctx: any) {

    }

    static addPerson(_: any, input: any, ctx: any) {

    }

    static removePerson(_: any, input: any, ctx: any) {

    }

    static setPremium(_: any, input: any, ctx: any) {

    }

    static setVerified(_: any, input: any, ctx: any) {

    }
}


export { Resolver };