import { MessageBuilder, Webhook } from 'discord-webhook-node';
export const DiscordWebhook = new Webhook({
    url: "https://discord.com/api/webhooks/1331599355777384520/8MMbSar1hahl0j5kii9OjPG4gVQCiWP6gMS6tIT4NGhrqQpBizDX2tawTdDeDnYuRje6",
    retryOnLimit: false
});

export const SendOnlineMessage = async () => {
    const embed = new MessageBuilder()
        .setTitle('Actunime API')
        .setColor(0x00ff00)
        .setDescription("L'API viens de redémarrer.\n \n*Un redémarrage fait souvent suite à une mise à jour du site ou de l'API.*")
        .setFooter('Actunime API | Logs')
        .setTimestamp();

    await DiscordWebhook.send(embed);
}

export { MessageBuilder }