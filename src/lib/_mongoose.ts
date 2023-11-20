import mongoose from 'mongoose';
import AutoIncrement from './_autoIncrementPlugin';

mongoose.connection.on('connected', async () => {
    console.log('Base de donnée :(', 'Actunime', ') est connecté !');
    await AutoIncrement.initialise();
});

mongoose.connection.on('disconnected', () => {
    console.log('Base de donnée :(', 'Actunime', ") s'est déconnecté !");
});

export function connectDB() {
    mongoose.connect('mongodb://192.168.1.39:27017', {
        user: 'apiaccess',
        pass: '8#tM*^J&K%T!*N',
        dbName: 'Actunime',
        autoIndex: false,
        autoCreate: true
    });
}