const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Startet den Bot neu.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('♻️ Bot wird neu gestartet...')
            .setDescription('Bitte warte einen Moment.')
            .setColor('Orange');

        await interaction.reply({ embeds: [embed] });

        setTimeout(() => {
            process.exit(0);
        }, 2000);
    },
};