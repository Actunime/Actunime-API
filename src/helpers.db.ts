
import { CallbackWithoutResultAndOptionalError, PostMiddlewareFunction, Schema, model, Document, Error } from "mongoose";
import { AnimeModel } from "./medias/animes/_anime.type";
import { customAlphabet } from 'nanoid'
import { mongoose } from "@typegoose/typegoose";

export async function createFakeData() {

    // const AnimeMongoDB = new AnimeModel({
    //     id: "acy2j",
    //     updatesRequests: [{
    //         versionId: 1,
    //         data: { title: { romaji: "test" } },
    //         requestDate: new Date(),
    //         status: 'UNVERIFIED',
    //     }]
    // });
    await AnimeModel.syncIndexes()
    let test = new AnimeModel({
        public: true,
        updates: [{
            versionId: 1,
            data: { title: { romaji: "test" } },
            createdAt: new Date(),
        }],
        updatesRequests: [{
            versionId: 1,
            data: { title: { romaji: "test" } },
            createdAt: new Date(),
            status: 'UNVERIFIED',
        }]
    })
    await test.save();
    // console.log("Validé")
    await AnimeModel.create(test).catch((err) => console.log("err", err.toString()));

    // await AnimeMongoDB.save();
    // await [...Array(100000)].map(async () => {
    //     const AnimeMongoDB = new AnimeModel({
    //         updatesRequests: [{
    //             versionId: 1,
    //             data: { title: { romaji: "test" } },
    //             requestDate: new Date(),
    //             status: 'UNVERIFIED',
    //         }]
    //     });
    //     return await AnimeMongoDB.save();
    // })

    // await AnimeMongoDB.validate();
    // console.log(AnimeMongoDB.toJSON())


    let data = await AnimeModel.find({ id: 'acy2j' });
    // console.log(data?.toObject()
    // .map(d => d.toObject())
    // )
    console.log(data.map(d => d.toObject())
    )
}

export function genPublicID() {
    const alphabet = `${Date.now()}abcdefghijklmnopqrstuvwxyz`;
    const nanoid = customAlphabet(alphabet, 5);
    let generatedID = nanoid()
    console.log(generatedID)
    return generatedID
}