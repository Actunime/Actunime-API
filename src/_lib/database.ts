import mongoose, { ConnectOptions } from 'mongoose';
import cache from 'ts-cache-mongoose';
import { APIError } from './error';
import { DevLog } from './logger';

export const mongooseCache = cache.init(mongoose, {
  defaultTTL: '60 seconds',
  engine: 'memory',
  debug: process.env.NODE_ENV !== 'production',
});

export const connectDB = async () => {
  const user = process.env.DB_USER;
  const pass = process.env.DB_PASSWORD;
  const uri = process.env.DB_URI;
  const dbName = process.env.DB_NAME;

  if (!user || !pass || !uri || !dbName)
    throw new APIError(
      'Les informations de connexion a la base de données sont incorrecte',
      'SERVER_ERROR'
    );

  const opts: ConnectOptions = {
    bufferCommands: false,
    user,
    pass: encodeURIComponent(pass),
    dbName,
    autoIndex: true,
    connectTimeoutMS: 5000,
    retryWrites: true,
    w: 'majority',
    appName: 'Actunime-Cluster0',
  };

  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri, opts);
};

mongoose.connection.on('connected', () => {
  DevLog('DB: Base de données connectée', 'debug');
});

mongoose.connection.on('disconnected', () => {
  DevLog('DB: Base de données déconnectée', 'warn');
});
