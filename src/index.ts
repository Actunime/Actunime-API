import mongoose from 'mongoose';

import dotenv from 'dotenv';
dotenv.config({ path: [`.env.${process.env.NODE_ENV || 'development'}`.trim()] });

import { activesSessions } from './_utils/_mongooseSession';

import Server from './_server';
import { connectDB } from './_utils';

process.on('SIGINT', async function () {
  try {
    for await (const [, session] of activesSessions) {
      await session.abortTransaction();
      await session.endSession();
    }
    await mongoose.connection.close()
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

connectDB().then(() => Server.start());