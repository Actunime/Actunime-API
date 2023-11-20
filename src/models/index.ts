import * as Animes from './animes';
import * as AnimesRequests from './animesRequests';
import * as Mangas from './mangas';
import * as Characters from './characters';
import * as Tracks from './tracks';
import * as Persons from './persons';
import * as Companys from './companys';
import * as Users from './users';
import * as Updates from './updates';
import * as DefaultData from './_defaultData';


const resolvers = {
    Query: {
        ...DefaultData.Resolver.Query,
        ...Animes.Resolver.Query,
        ...AnimesRequests.Resolver.Query,
        ...Mangas.Resolver.Query,
        ...Characters.Resolver.Query,
        ...Tracks.Resolver.Query,
        ...Persons.Resolver.Query,
        ...Companys.Resolver.Query,
        ...Users.Resolver.Query,
    },
    Mutation: {
        ...Animes.Resolver.Mutation,
        ...AnimesRequests.Resolver.Mutation,
        ...Mangas.Resolver.Mutation,
        ...Characters.Resolver.Mutation,
        ...Tracks.Resolver.Mutation,
        ...Persons.Resolver.Mutation,
        ...Companys.Resolver.Mutation,
        ...Users.Resolver.Mutation,
    }
}

export {
    Animes,
    Mangas,
    Characters,
    Tracks,
    Persons,
    Companys,
    Users,
    Updates,
    resolvers
}

export * from './_resolverHelper';
export * as GlobalInterface from './_globalInterface';