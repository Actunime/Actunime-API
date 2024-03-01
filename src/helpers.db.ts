
import { AnimeInput } from './medias/animes/_anime.input';
import { MediaPersonGender } from './utils/_media.types';
import { CompanyType } from './medias/companys/_company.type';
import { DefaultAnimeFormatEnum, DefaultSourceEnum, DefaultStatusEnum } from './medias/defaultData';
import { AnimeModel } from './medias/animes';
import { PersonrRoleRelationLabel } from './medias/persons/_person.type';
import { CharacterRelationLabel, TrackRelationLabel } from './medias';



export async function createFakeData() {

    // await AnimeModel.syncIndexes()

    // await mongoose.connection.db.dropDatabase();

    try {
        let FakeData = await AnimeInput.createUpdate({
            groupe: {
                // exist: {
                //     id: "df1t4",
                // }
                new: {
                    name: "Kimetsu no Yaiba"
                }
            },
            title: {
                romaji: "Kimetsu no Yaiba",
                native: "鬼滅の刃",
                alias: ['kny']
            },
            synopsis: "Tanjirō Kamado mène une vie paisible, quoique modeste, avec sa famille jusqu'au jour où les siens sont massacrés alors qu'il est descendu en ville vendre du charbon. Seule Nezuko, sa petite sœur, survit, mais elle est transformée en démon. Pour Tanjirō commence un long périple afin de trouver un remède permettant de faire retrouver une forme humaine à sa sœur.",
            date: {
                start: new Date('2021-04-06'),
                end: new Date('2021-09-28')
            },
            image: {
                poster: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
                banner: 'https://laverdadnoticias.com/__export/1586230047171/sites/laverdad/img/2020/04/06/kimetsu_no_yaiba_anime_wallpapers.png_673822677.png'
            },
            status: DefaultStatusEnum['ENDED'],
            source: {
                origine: DefaultSourceEnum['MANGA'],
            },
            format: DefaultAnimeFormatEnum['SERIE'],
            adult: false,
            explicit: true,
            episodes: {
                airing: 26,
                total: 26,
                durationMinutePerEp: 23
            },
            companys: {
                news: [
                    {
                        data: {
                            name: 'Ufotable',
                            type: CompanyType['STUDIO'],
                            links: [
                                {
                                    name: 'Site officiel',
                                    value: 'http://www.ufotable.com/index.html'
                                },
                                {
                                    name: 'Wikipedia',
                                    value: 'https://fr.wikipedia.org/wiki/Ufotable'
                                }
                            ]
                        },
                    }
                ]
            },
            links: [
                { name: "Site officiel", value: 'https://kimetsu.com/anime/risshihen/' }
            ],
            staffs: {
                news: [{
                    label: PersonrRoleRelationLabel.PRODUCTEUR,
                    data: {
                        name: {
                            first: 'Kondou',
                            end: 'Hikaru'
                        },
                        birthDate: '1969-12-02',
                        bio: "Hikaru Kondou est un producteur d'animation et le fondateur du studio d'animation ufotable.",
                        image: "https://cdn.myanimelist.net/images/voiceactors/3/21563.jpg"
                    }
                }]
            },
            characters: {
                news: [{
                    label: CharacterRelationLabel.Principal,
                    data: {
                        name: {
                            first: 'Tanjirou',
                            end: 'Kamado',
                            alias: ['竈門 炭治郎']
                        },
                        gender: MediaPersonGender['MAN'],
                        bio: "Tanjirou Kamado est le protagoniste principale de Demon Slayer, il est devenu un chasseur de démon et a rejoint un groupe de chasseur de démon dans le but de venger sa famille et de pouvoir guérrir sa soeur.",
                        image: "https://cdn.myanimelist.net/images/characters/6/386735.jpg",
                        actors: {
                            news: [
                                {
                                    label: PersonrRoleRelationLabel.DOUBLAGE_SEIYU,
                                    data: {
                                        name: {
                                            first: 'Hanae',
                                            end: 'Natsuki'
                                        },
                                        birthDate: '1991-06-26',
                                        image: "https://cdn.myanimelist.net/images/voiceactors/3/63380.jpg"
                                    }
                                }
                            ]
                        }
                    }
                }],
            },
            tracks: {
                news: [{
                    label: TrackRelationLabel.OPENING,
                    data: {
                        name: 'Gurenge',
                        artists: {
                            news: [{
                                label: PersonrRoleRelationLabel.CHANTEUSE,
                                data: {
                                    name: {
                                        alias: ['LISA']
                                    },

                                    links: [{ name: 'Wikipedia', value: 'https://fr.wikipedia.org/wiki/LiSA' }]
                                }
                            }]
                        }
                    }

                }]
            }
        }, 'direct_update', {
            author: '2cpw6',
            verifiedBy: '2cpw6'
        })

        await FakeData
        //     .save();

        let test = await AnimeModel.find()
        console.log(test.map(t => t.toJSON()))

        // await AnimeModel.deleteMany({"data.source.origine": "Manga"})
        // await modifed.populate('data.characters.vData data.companys.vData data.staffs.vData data.tracks.vData');

        // let start = Date.now();
        // let t = await AnimeModel.find(
        //     // { data: { date: { start: { $gte: new Date(2000, 0, 0), $lt: new Date(2025, 0, 0) } } } }
        // ).lean()
        // // .searchMediaByTitle('Kimetsu');
        // let ms = Date.now() - start
        // console.log('résults', t)
        // console.warn(ms, 'ms')

        // let x = themesAnime.map((n) => ({ label: n, value: n.toUpperCase().split(' ').join('_') }))


        // console.log(x, x.map(a => `${a.value} = ${a.value}`))

    } catch (err) {
        console.error(err)
    }

}
