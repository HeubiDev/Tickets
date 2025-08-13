const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { handleError, handleTimeout, safeReply } = require('../utils/interactionHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Startet den Bot neu.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const timeout = handleTimeout(interaction);
        
        try {
            const embed = new EmbedBuilder()
                .setTitle('♻️ Bot wird neu gestartet...')
                .setDescription('Bitte warte einen Moment.')
                .setColor('Orange');

            await safeReply(interaction, { 
                embeds: [embed],
                flags: MessageFlags.Flags.Ephemeral
            });

            setTimeout(() => {
                process.on('exit', () => {
                    require('child_process').spawn(process.argv.shift(), process.argv, {
                        cwd: process.cwd(),
                        detached: true,
                        stdio: 'inherit'
                    });
                });
                process.exit(0);
            }, 2000);
        } catch (error) {
            await handleError(interaction, error, 'restart');
        } finally {
            clearTimeout(timeout);
        }
    }
};