// import fs from 'fs';
// import { connectDB } from '../src/_utils';
// import {
//   ActivityModel,
//   AnimeModel,
//   CharacterModel,
//   CompanyModel,
//   GroupeModel,
//   MangaModel,
//   PatchModel,
//   PersonModel,
//   TrackModel,
// } from '../src/_lib/models';
// import dotenv from 'dotenv';
// import mongoose from 'mongoose';
// dotenv.config({
//   path: [`.env.${process.env.NODE_ENV || 'development'}`.trim()],
// });

// (async () => {
//   throw "Générer depuis la base de données êtes vous sur ?"
//   await connectDB();
//   const animes = await AnimeModel.find().lean();
//   fs.writeFileSync('./mokes/animes.json', JSON.stringify(animes, null, 2));

//   // const mangas = await MangaModel.find().lean();
//   // fs.writeFileSync('./mokes/mangas.json', JSON.stringify(mangas, null, 2));
//   const groupes = await GroupeModel.find().lean();
//   fs.writeFileSync('./mokes/groupes.json', JSON.stringify(groupes, null, 2));

//   const companys = await CompanyModel.find().lean();
//   fs.writeFileSync('./mokes/companys.json', JSON.stringify(companys, null, 2));
//   const persons = await PersonModel.find().lean();
//   fs.writeFileSync('./mokes/persons.json', JSON.stringify(persons, null, 2));
//   const characters = await CharacterModel.find().lean();
//   fs.writeFileSync(
//     './mokes/characters.json',
//     JSON.stringify(characters, null, 2)
//   );
//   const tracks = await TrackModel.find().lean();
//   fs.writeFileSync('./mokes/tracks.json', JSON.stringify(tracks, null, 2));
//   const patches = await PatchModel.find().lean();
//   fs.writeFileSync('./mokes/patches.json', JSON.stringify(patches, null, 2));
//   const activitys = await ActivityModel.find().lean();
//   fs.writeFileSync(
//     './mokes/activitys.json',
//     JSON.stringify(activitys, null, 2)
//   );

//   await mongoose.disconnect();
// })();
