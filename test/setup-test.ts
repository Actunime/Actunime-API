import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import loadMokes from './mock/db';

dotenv.config({
  path: [
    `.env.${
      process.env.NODE_ENV
        ? process.env.NODE_ENV === 'test'
          ? 'development'
          : 'production'
        : 'development'
    }`.trim(),
  ],
});

jest.setTimeout(30_000);

beforeAll(async () => {
  // put your client connection code here, example with mongoose:
  await mongoose.connect(process.env['MONGO_URI']!);
  await loadMokes();
});

afterAll(async () => {
  // put your client disconnection code here, example with mongoose:
  await mongoose.disconnect();
});
