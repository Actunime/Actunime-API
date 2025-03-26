// import dotenv from 'dotenv';
// dotenv.config({
//   path: [`.env.${process.env.NODE_ENV || 'development'}`.trim()],
// });

// import { connectDB } from '../src/_utils';
// import mongoose from 'mongoose';

// const start = async () => {
//   await connectDB();
// //   await (await import('./animes_routes')).CREATE_REQUEST();

//   /** Tout tester */
//   // const animes = await import('./animes_routes');
//   // await Promise.all(
//   //   Object.entries(animes).map(async ([, value]) => await value())
//   // );

//   // await (await import('./persons_routes')).UPDATE_REQUEST();
//   // const persons = await import('./persons_routes');
//   // await Promise.all(
//   //   Object.entries(persons).map(async ([, value]) => await value())
//   // );

//   // MailTransport.close();
//   await mongoose.disconnect();
// };

// start();
