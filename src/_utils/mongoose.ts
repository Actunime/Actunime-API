import mongoose, { ConnectOptions } from 'mongoose';

const opts: ConnectOptions = {
    bufferCommands: false,
    user: process.env.MONGODB_user,
    pass: `${process.env.MONGODB_pass}`,
    dbName: process.env.MONGODB_dbName,
    autoIndex: true,
    connectTimeoutMS: 5000,
};



export const connectDB = async () => {
    console.log('URI', process.env.MONGODB_URI, 'options', opts);
    
    console.log("Connexion a la base de données...")
    await mongoose.connect(process.env.MONGODB_URI!, opts);
    console.log("Base de données connectée");
}