const fs = require('fs');
const path = require('path');
const ticketsPath = path.join(__dirname, '../tickets.json');
const { EmbedBuilder, MessageFlags } = require('discord.js');
const { handleError, handleTimeout, safeReply } = require('../utils/interactionHandler');

module.exports = {
    data: {
        name: 'close',
        description: 'Schließt das Ticket und sendet das Transkript.'
    },
    async execute(interaction) {
        const timeout = handleTimeout(interaction);
        
        try {
            // Ticket-Daten laden
            const tickets = JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
            const ticket = tickets[interaction.channel.id];
            if (!ticket) {
                return await safeReply(interaction, { 
                    content: 'Kein Ticket für diesen Channel gefunden.', 
                    flags: MessageFlags.Flags.Ephemeral 
                });
            }

            // Nachrichten sammeln
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const transcript = messages
                .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
                .map(msg => `[${msg.author.tag}]: ${msg.content}`)
                .join('\n');

            // Embed erstellen
            const embed = new EmbedBuilder()
                .setTitle('Ticket-Transkript')
                .setDescription('Hier ist das Transkript deines Tickets.')
                .addFields(
                    { name: 'Ersteller', value: `<@${ticket.userId}> (${ticket.username})`, inline: true },
                    { name: 'Transkript', value: transcript.slice(0, 1024) || 'Keine Nachrichten.' }
                )
                .setColor(0x00AE86);

            // Transkript an User senden
            try {
                const user = await interaction.client.users.fetch(ticket.userId);
                await user.send({ embeds: [embed] });
            } catch (err) {
                console.error('Konnte Transkript nicht an User senden:', err);
            }

            // Transkript an Channel senden
            const transcriptChannelId = process.env.TRANSCRIPT_CHANNEL_ID;
            if (transcriptChannelId) {
                const transcriptChannel = await interaction.client.channels.fetch(transcriptChannelId);
                if (transcriptChannel) {
                    await transcriptChannel.send({ embeds: [embed] });
                }
            }

            // Ticket aus Datei entfernen
            delete tickets[interaction.channel.id];
            fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2));

            await safeReply(interaction, { 
                content: 'Ticket geschlossen. Transkript wurde versendet.', 
                flags: MessageFlags.Flags.Ephemeral 
            });
            await interaction.channel.delete();
        } catch (error) {
            await handleError(interaction, error, 'close');
        } finally {
            clearTimeout(timeout);
        }
    }
};