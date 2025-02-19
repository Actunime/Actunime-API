import mongoose, { ConnectOptions } from "mongoose";



export const connectDB = async (mUser?: string, mPass?: string, mDbName?: string) => {
    const user = mUser || process.env.MONGODB_user ;
    const password = encodeURIComponent(mPass || process.env.MONGODB_pass as string);
    const uri = `mongodb://${user}:${password}@192.168.1.101:27017/admin?replicaSet=rs0`;
    const opts: ConnectOptions = {
        bufferCommands: false,
        // user: process.env.MONGODB_user,
        // pass: `${process.env.MONGODB_pass}`,
        dbName: mDbName || process.env.MONGODB_dbName,
        autoIndex: true,
        connectTimeoutMS: 5000,
        // replicaSet: 'rs0',
    };
    console.log("URI", uri, "options", opts);

    console.log("Connexion a la base de données...");
    try {
        await mongoose.connect(uri!, opts);
        console.log("Base de données connectée");
    } catch (error) {
        console.error(error);
        throw error;
    }
};
