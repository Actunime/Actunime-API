import { CheckAnimeNextEpisode } from "@actunime/mongoose-models";
import { DiscordWebhook } from "./_discordWebhook";

export class Services {
    public start() {
        this.checkAnimeNextEpisodes()
    }

    private checkAnimeNextEpisodes() {
        setInterval(() => {
            CheckAnimeNextEpisode({
                onNewEpisode: (anime) => {
                    DiscordWebhook.info(`Épisode n°${anime.episodes?.airing} est en cours de diffusion`, anime.title.default, `Système automatique à titre indicatif (beta)`);
                },
                onWarnTotalEpisode: (anime) => {
                    DiscordWebhook.warning(`Pas de total d'épisode ! (avertissement)`, anime.title.default, `Nombre total d'épisodes manquants à définir rapidement - Système automatique (beta)`);
                },
                onEnded: (anime) => {
                    DiscordWebhook.info(`La diffusion est terminé`, anime.title.default, `Système automatique à titre indicatif (beta)`);
                }
            });
        }, 60 * 1000 * 60);
    }
}