const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { handleError, handleTimeout, safeReply } = require('../utils/interactionHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketsetup')
        .setDescription('Erstellt das Ticket-Panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        const timeout = handleTimeout(interaction);
        
        try {
            await interaction.deferReply({ flags: MessageFlags.Flags.Ephemeral });

            const panelEmbed = new EmbedBuilder()
                .setTitle('🎫 Support-Ticket')
                .setDescription('Klicke unten um ein Ticket zu erstellen')
                .setColor('#0099ff');

            const ticketButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('Ticket erstellen')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📩')
            );

            await interaction.channel.send({
                embeds: [panelEmbed],
                components: [ticketButton]
            });

            await interaction.editReply({
                content: '✅ Ticket-Panel wurde erfolgreich erstellt!',
                flags: MessageFlags.Flags.Ephemeral
            });
        } catch (error) {
            await handleError(interaction, error, 'ticketsetup');
        } finally {
            clearTimeout(timeout);
        }
    }
};