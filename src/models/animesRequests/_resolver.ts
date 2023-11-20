import { AnimeRequestClass, AnimeRequestProps } from "../../classes/animes/AnimeRequest.class";
import { GraphqlCheckAuth } from "../../utils/graphqlCheckAuth";
import { CharacterRequestResolver } from "../charactersRequests/_resolver";

type QueryMutation = {
    [key: string]: (root: any, args: any, context: any) => void;
}

let fakeCache = "Test"

export class Resolver {

    public static Query: QueryMutation = {
        test: GraphqlCheckAuth.bind(null, this.test)
    }

    public static Mutation: QueryMutation = {
        addRequestAnime: GraphqlCheckAuth.bind(null, this.AddRequestAnime)
    }

    private static test(root: any, args: any, context: any) {
        console.log('requete ici test')
        return fakeCache
    }

    private static testMutation(root: any, args: any, context: any) {
        console.log('requete ici testMutation', args)
        fakeCache = args.value;
        return fakeCache
    }

    private static async AddRequestAnime(root: any, args: AnimeRequestProps, context: any) {
        // console.log('requete AddRequestAnime', args)
        // let formatedCharactersTest = await CharacterRequestResolver.toFormatedModel(args.characters.new);
        // let saveAndGetIds = await CharacterRequestResolver.saveAndReturnIds(formatedCharactersTest)
        // console.log(formatedCharactersTest, saveAndGetIds);

        let AnimeRequest = new AnimeRequestClass(args);
        await AnimeRequest.init();
         AnimeRequest.unsavedDocument.map((d) => console.log(d.toJSON()));
        console.log('saved', AnimeRequest.unsavedDocument.length)
        return false;
    }
}