const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ticketDB = require('../utils/ticketDB');

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
        const user = interaction.options.getUser('user');
        const ticketChannelId = ticketDB.get(user.id);

        if (!ticketChannelId) {
            const notFoundEmbed = new EmbedBuilder()
                .setTitle('❌ Kein Ticket gefunden')
                .setDescription(`Für **${user.tag}** existiert kein gespeicherter Ticket-Eintrag.`)
                .setColor('Red')
                .setTimestamp();

            return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
        }

        ticketDB.delete(user.id);

        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Ticket-Eintrag gelöscht')
            .setDescription(`Der Ticket-Eintrag für **${user.tag}** wurde entfernt.`)
            .setColor('Green')
            .setTimestamp();

        return interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};