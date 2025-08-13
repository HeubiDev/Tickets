const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    async logAction(client, action, data) {
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (!logChannelId) return console.warn('LOG_CHANNEL_ID nicht gesetzt!');

        const logChannel = await client.channels.fetch(logChannelId).catch(console.error);
        if (!logChannel) return;

        const embed = new EmbedBuilder();
        let components = [];
        let mention = null;

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
                        { name: 'Bearbeiter', value: `<@${data.claimerId}>`, inline: true },
                        { name: 'Benutzer', value: `<@${data.userId}>`, inline: true },
                        { name: 'Status', value: '⏳ Prioritätsauswahl steht aus', inline: true }
                    );
                mention = `<@${data.claimerId}>`;
                break;

            case 'ticket_priority': // NEU: Priority-Logging
                const priorityInfo = {
                    high: { emoji: '🔴', name: 'Hoch', color: 0xff0000 },
                    medium: { emoji: '🟡', name: 'Mittel', color: 0xffff00 },
                    low: { emoji: '🟢', name: 'Niedrig', color: 0x00ff00 }
                }[data.priority] || { emoji: '❓', name: 'Unbekannt', color: 0x000000 };

                embed.setTitle(`${priorityInfo.emoji} Priorität gesetzt`)
                    .setColor(priorityInfo.color)
                    .addFields(
                        { name: 'Ticket', value: `<#${data.channelId}>`, inline: true },
                        { name: 'Priorität', value: priorityInfo.name, inline: true },
                        { name: 'Bearbeiter', value: `<@${data.claimerId}>`, inline: true },
                        { name: 'Benutzer', value: `<@${data.userId}>`, inline: true }
                    )
                    .setTimestamp();
                mention = `<@${data.claimerId}>`;
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
                    mention = `<@${data.claimerId}>`;
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
                
                if (data.claimerId) {
                    embed.addFields({ name: 'Bearbeiter', value: `<@${data.claimerId}>`, inline: true });
                }
                break;

            default:
                console.warn(`Unbekannte Aktion beim Logging: ${action}`);
                return;
        }

        await logChannel.send({
            content: mention,
            embeds: [embed],
            components: components.length > 0 ? components : undefined,
            allowedMentions: { users: mention ? [mention.replace(/[<@>]/g, '')] : [] }
        });
    }
};