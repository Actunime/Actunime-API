import mongoose, { ConnectOptions } from 'mongoose';

const user = process.env.MONGODB_user;
const password = encodeURIComponent(process.env.MONGODB_pass as string);
const uri = `mongodb://${user}:${password}@192.168.1.101:27017,192.168.1.102:27017,192.168.1.104:27017/admin?replicaSet=rs0`;

const opts: ConnectOptions = {
    bufferCommands: false,
    // user: process.env.MONGODB_user,
    // pass: `${process.env.MONGODB_pass}`,
    dbName: process.env.MONGODB_dbName,
    autoIndex: true,
    connectTimeoutMS: 5000,
    // replicaSet: 'rs0',
};



export const connectDB = async () => {
    console.log('URI', uri, 'options', opts);
    
    console.log("Connexion a la base de données...")
    await mongoose.connect(uri!, opts);
    console.log("Base de données connectée");
}