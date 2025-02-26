import mongoose, { ConnectOptions } from "mongoose";
import cache from 'ts-cache-mongoose';

export const mongooseCache = cache.init(mongoose, {
    defaultTTL: '60 seconds',
    engine: "memory",
    debug: process.env.NODE_ENV !== "production",
})

export const connectDB = async () => {
    const user = process.env.MONGODB_user;
    const password = encodeURIComponent(process.env.MONGODB_pass as string);
    const uri = process.env.MONGODB_URI;
    const opts: ConnectOptions = {
        bufferCommands: false,
        user: user,
        pass: password,
        dbName: process.env.MONGODB_dbName,
        autoIndex: true,
        connectTimeoutMS: 5000,
        // replicaSet: 'rs0',
    };

    console.log("Connexion a la base de données...");
    await mongoose.connect(uri!, opts);
    console.log("Base de données connectée");
};
