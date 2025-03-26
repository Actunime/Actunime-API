import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

export const config = {
  Memory: true,
  IP: '127.0.0.1',
  Port: '27017',
  Database: 'Test',
};

export default async function globalSetup() {
  if (config.Memory) {
    // Config to decide if an mongodb-memory-server instance should be used
    // it's needed in global space, because we don't want to create a new instance every test-suite
    const instance = await MongoMemoryReplSet.create({ replSet: { count: 3 } });
    const uri = instance.getUri();
    (global as any).__MONGOINSTANCE = instance;
    process.env.MONGO_URI = uri.slice(0, uri.lastIndexOf('/'));
  } else {
    process.env.MONGO_URI = `mongodb://${config.IP}:${config.Port}`;
  }

  // The following is to make sure the database is clean before a test suite starts
  const conn = await mongoose.connect(
    `${process.env.MONGO_URI}/${config.Database}`
  );
  await conn.connection.db?.dropDatabase();
  await mongoose.disconnect();
}
