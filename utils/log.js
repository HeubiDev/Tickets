const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    async logAction(client, action, data) {
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (!logChannelId) return console.warn('LOG_CHANNEL_ID nicht gesetzt!');

        const logChannel = await client.channels.fetch(logChannelId).catch(console.error);
        if (!logChannel) return;

        const embed = new EmbedBuilder();
        let components = [];

        switch (action) {
            case 'ticket_create':
                embed.setTitle('🎫 Ticket erstellt')
                    .setColor(0x00ff00)
                    .addFields(
                        { name: 'Benutzer', value: `<@${data.userId}>`, inline: true },
                        { name: 'Ticket', value: `<#${data.channelId}>`, inline: true },
                        { name: 'Zeit', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                    );

                components = [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`claim_ticket_${data.channelId}`)
                            .setLabel('Ticket claimen')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('🙋')
                    )
                ];
                break;

            case 'ticket_claim':
                embed.setTitle('🙋 Ticket geclaimt')
                    .setColor(0xffff00)
                    .addFields(
                        { name: 'Ticket', value: `<#${data.channelId}>`, inline: true },
                        { name: 'Claimer', value: `<@${data.claimerId}>`, inline: true },
                        { name: 'Benutzer', value: `<@${data.userId}>`, inline: true }
                    );
                break;

            case 'ticket_message':
                embed.setTitle('💬 Neue Ticket-Nachricht')
                    .setColor(0x00bfff)
                    .setDescription(`Neue Nachricht in <#${data.channelId}>`)
                    .addFields(
                        { name: 'Autor', value: `<@${data.authorId}>`, inline: true },
                        { name: 'Inhalt', value: data.content.substring(0, 1024), inline: false }
                    );

                if (data.claimerId) {
                    embed.addFields({ name: 'Zuständig', value: `<@${data.claimerId}>`, inline: true });
                }
                break;

            case 'ticket_close':
                embed.setTitle('🔒 Ticket geschlossen')
                    .setColor(0xff0000)
                    .addFields(
                        { name: 'Ticket', value: data.channelName, inline: true },
                        { name: 'Geschlossen von', value: `<@${data.closerId}>`, inline: true },
                        { name: 'Dauer', value: data.duration, inline: true }
                    );
                break;
        }

        await logChannel.send({
            content: action === 'ticket_message' && data.claimerId ? `<@${data.claimerId}>` : undefined,
            embeds: [embed],
            components: components.length > 0 ? components : undefined
        });
    }
};