import { Schema, model } from "mongoose";


const AutoIncrementSchema = new Schema({
    _id: { type: String, required: true },
    count: { type: Number, default: 0 }
});

const AutoIncrementModel = model('autoIncrementManager', AutoIncrementSchema);

async function createDbIfNotExist(db: string) {
    const incDb = await AutoIncrementModel.findById(db);
    if (!incDb) {
        await AutoIncrementModel.create({ _id: db });
        console.log('Incrementation ' + db + " a été crée ");
    }
}

export const AutoIncrementIds = async (db: string, schema: Schema, options: any) => {
    createDbIfNotExist(db);
    schema.post('validate', async (doc): Promise<void> => {

        let AutoIncrement = await AutoIncrementModel.findByIdAndUpdate({ _id: db, }, { $inc: { count: 1 } });
        if (AutoIncrement) doc.id = AutoIncrement?.count;

        console.log(db, 'gen id', doc.id)
    })

    schema.pre('save', function (next) {
        var doc = this;
        console.log(db, 'save', doc.toObject())
        next(new Error())
    })
};