import fetch from 'node-fetch';
import fs from 'fs';

const a_ = await fetch('https://api.actunime.fr/v1/animes');
const a_data = await a_.json();

fs.writeFileSync('./test_data/animes.json', JSON.stringify(a_data.results.map((a) => {
    delete a._id;
    delete a.__v;
    return a;
}), null, 2));

const c_ = await fetch('https://api.actunime.fr/v1/characters');
const c_data = await c_.json();

fs.writeFileSync('./test_data/characters.json', JSON.stringify(c_data.results, null, 2));

const p_ = await fetch('https://api.actunime.fr/v1/persons');
const p_data = await p_.json();

fs.writeFileSync('./test_data/persons.json', JSON.stringify(p_data.results, null, 2));

const co_ = await fetch('https://api.actunime.fr/v1/companys');
const co_data = await co_.json();

fs.writeFileSync('./test_data/companys.json', JSON.stringify(co_data.results, null, 2));


const t_ = await fetch('https://api.actunime.fr/v1/tracks');
const t_data = await t_.json();

fs.writeFileSync('./test_data/tracks.json', JSON.stringify(t_data.results, null, 2));

const g_ = await fetch('https://api.actunime.fr/v1/groupes');
const g_data = await g_.json();

fs.writeFileSync('./test_data/groupes.json', JSON.stringify(g_data.results, null, 2));

const i_ = await fetch('https://api.actunime.fr/v1/images');
const i_data = await i_.json();

fs.writeFileSync('./test_data/images.json', JSON.stringify(i_data.results, null, 2));