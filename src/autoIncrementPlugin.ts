import { Document, Schema, model } from 'mongoose';

class AutoIncrement {


    static schema = new Schema({
        _id: { type: String, required: true },
        count: { type: Number, default: 0 }
    });

    static model = model('autoIncrement', this.schema);

    static async initialise() {

        let animesIncrement = await this.model.findById('animes');
        if (!animesIncrement) await this.model.create({ _id: 'animes' });

        let mangasIncrement = await this.model.findById('mangas');
        if (!mangasIncrement) await this.model.create({ _id: 'mangas' });

        let personsIncrement = await this.model.findById('persons');
        if (!personsIncrement) await this.model.create({ _id: 'persons' });

        let charactersIncrement = await this.model.findById('characters');
        if (!charactersIncrement) await this.model.create({ _id: 'characters' });

        let tracksIncrement = await this.model.findById('tracks');
        if (!tracksIncrement) await this.model.create({ _id: 'tracks' });

        let companysIncrement = await this.model.findById('companys');
        if (!companysIncrement) await this.model.create({ _id: 'companys' });

        let usersIncrement = await this.model.findById('users');
        if (!usersIncrement) await this.model.create({ _id: 'users' });

        let updatesIncrement = await this.model.findById('updates');
        if (!updatesIncrement) await this.model.create({ _id: 'updates' });

    }

    static reservedIds: Map<string, number> = new Map();

    static async onValidate(db: string, data: Document) {
        if (data._id) return;
        if (this.reservedIds.has(db + "-pre-" + data._id)) return;

        let currentIndex = await AutoIncrement.model.findById(db);
        if (!currentIndex) throw "Erreur autoincrementation";

        let i = currentIndex.count + 1;
        if (this.reservedIds.has(db + "-pre-" + i)) {
            while (this.reservedIds.has(db + "-pre-" + i)) {
                i++
                if (!this.reservedIds.has(db + "-pre-" + i)) {
                    this.reservedIds.set(db + "-pre-" + i, i)
                    data._id = i;
                    console.log('ID', db, i, "a été réservé.")
                    break;
                }
            }
        } else {
            this.reservedIds.set(db + "-pre-" + i, i);
            data._id = i;
            console.log('ID', db, i, "a été réservé.")
        }
    }

    static async onSave(db: string, data: Document) {

        if (this.reservedIds.has(db + "-pre-" + data._id)) {
            let id = this.reservedIds.get(db + "-pre-" + data._id);

            if (!id) return;

            let currentIndex = await AutoIncrement.model.findById(db);
            if (!currentIndex) throw "Erreur autoincrementation " + db;

            if (currentIndex.count < id) {
                await AutoIncrement.model.findByIdAndUpdate(db, { count: id }, { new: true, upsert: true });
                console.log(db, 'increment', id, "sauvegardé");
            }

            this.reservedIds.delete(db + "-pre-" + data._id);
        } else {
            if (!data._id) throw "Générateur d'identifiant : Pas d'id réservé ???";
        }
    }

    static AutoIncrement(schema: Schema, db: 'animes' | 'mangas' | 'updates' | 'characters' | 'tracks' | 'persons' | 'companys' | 'users', onSave?: (id: number) => void) {
        schema.post('validate', AutoIncrement.onValidate.bind(this, db));
        schema.pre('save', () => console.log('save', db))
        schema.post('save', this.onSave.bind(this, db));
    }
}



export default AutoIncrement;