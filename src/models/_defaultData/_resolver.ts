import { formats, sources, status } from "./defaultData";


type QueryMutation = {
    [key: string]: (root: any, args: any, context: any) => void;
}

export class Resolver {
    public static Query: QueryMutation = {
        defaultData: this.getDefaultData
    }

    private static getDefaultData() {
        return {
            sources,
            status,
            formats
        }
    }
}