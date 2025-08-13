const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const ticketDB = require('../utils/ticketDB');
const { handleError, handleTimeout, safeReply } = require('../utils/interactionHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearticket')
        .setDescription('Entfernt einen Ticket-Kanal-Eintrag aus der tickets.json.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User, dessen Ticket-Eintrag gelöscht werden soll.')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const timeout = handleTimeout(interaction);
        
        try {
            const user = interaction.options.getUser('user');
            const ticketChannelId = ticketDB.get(user.id);

            if (!ticketChannelId) {
                const notFoundEmbed = new EmbedBuilder()
                    .setTitle('❌ Kein Ticket gefunden')
                    .setDescription(`Für **${user.tag}** existiert kein gespeicherter Ticket-Eintrag.`)
                    .setColor('Red')
                    .setTimestamp();

                return await safeReply(interaction, { 
                    embeds: [notFoundEmbed], 
                    flags: MessageFlags.Flags.Ephemeral 
                });
            }

            ticketDB.delete(user.id);

            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Ticket-Eintrag gelöscht')
                .setDescription(`Der Ticket-Eintrag für **${user.tag}** wurde entfernt.`)
                .setColor('Green')
                .setTimestamp();

            await safeReply(interaction, { 
                embeds: [successEmbed], 
                flags: MessageFlags.Flags.Ephemeral 
            });
        } catch (error) {
            await handleError(interaction, error, 'clearticket');
        } finally {
            clearTimeout(timeout);
        }
    }
};