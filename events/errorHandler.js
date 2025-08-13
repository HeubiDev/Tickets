const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'error',
    async execute(error, client) {
        const logChannel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);
        if (!logChannel) return;

        const errorEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('⚠️ Systemfehler')
            .addFields(
                { name: 'Fehler', value: `\`\`\`${error.stack || error}\`\`\``, inline: false },
                { name: 'Zeit', value: new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }), inline: true }
            );

        await logChannel.send({ embeds: [errorEmbed] });
    }
};